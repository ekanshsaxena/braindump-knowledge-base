import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';
import Settings from '@/models/Settings';
import { categorizeContent } from '@/lib/ai';
import { extractUrls, fetchUrlMetadata } from '@/lib/metadata';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const query: Record<string, unknown> = { userId };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'all') {
      query['categories.name'] = category;
    }

    const [entries, total, categories] = await Promise.all([
      EntryModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EntryModel.countDocuments(query),
      EntryModel.aggregate([
        { $match: { userId } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories.name', count: { $sum: 1 }, emoji: { $first: '$categories.emoji' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      entries,
      total,
      pages: Math.ceil(total / limit),
      categories: categories.map((c) => ({ name: c._id, emoji: c.emoji, count: c.count })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/entries]', message);
    return NextResponse.json(
      { error: message, entries: [], total: 0, pages: 0, categories: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const urls = extractUrls(content);
    const hasText = content.replace(/https?:\/\/[^\s]+/g, '').trim().length > 0;

    let type: 'text' | 'url' | 'mixed' = 'text';
    let urlMetadata = null;
    let primaryUrl = '';

    if (urls.length > 0) {
      type = hasText ? 'mixed' : 'url';
      primaryUrl = urls[0];
      urlMetadata = await fetchUrlMetadata(primaryUrl);
    }

    // Only include URL metadata when it adds real context:
    // - entry is a pure URL (no user text), AND
    // - the title is meaningfully different from the site name (not generic like "Instagram")
    const metaIsUseful =
      type === 'url' &&
      urlMetadata?.title &&
      urlMetadata.title.toLowerCase() !== (urlMetadata.siteName ?? '').toLowerCase();

    const contentForAI = metaIsUseful
      ? [
          `Title: ${urlMetadata!.title}`,
          urlMetadata!.description && `Description: ${urlMetadata!.description}`,
          urlMetadata!.siteName && `Source: ${urlMetadata!.siteName}`,
          content,
        ]
          .filter(Boolean)
          .join('\n')
      : content;

    const settings = await Settings.findOne({ userId }).lean();

    const categorization =
      settings && (settings.anthropicApiKey || settings.geminiApiKey)
        ? await categorizeContent(contentForAI, [], {
            anthropicApiKey: settings.anthropicApiKey ?? '',
            geminiApiKey: settings.geminiApiKey ?? '',
            priority: settings.priority ?? 'anthropic',
            maxTokens: settings.maxTokens ?? 1024,
            userCategories: settings.userCategories ?? [],
          })
        : { title: '', categories: [{ name: 'Uncategorized', emoji: '📌' }], tags: [], summary: content.slice(0, 120) };

    const entry = await EntryModel.create({
      userId,
      content,
      type,
      url: primaryUrl || undefined,
      urlMetadata: urlMetadata || undefined,
      categories: categorization.categories,
      tags: categorization.tags,
      title: categorization.title ?? '',
      summary: categorization.summary,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error('[POST /api/entries]', err);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}
