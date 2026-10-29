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
    const tag = searchParams.get('tag') || '';
    const pinned = searchParams.get('pinned');
    const archived = searchParams.get('archived');
    const type = searchParams.get('type') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = { userId };

    // By default hide archived entries (unless explicitly requesting them)
    if (archived === 'true') {
      query.archived = true;
    } else {
      query.archived = { $ne: true };
    }

    if (pinned === 'true') query.pinned = true;

    if (search) query.$text = { $search: search };

    if (category && category !== 'all') query['categories.name'] = category;

    if (tag) query.tags = tag;

    if (type) query.type = type;

    const sortOrder = sort === 'oldest'
      ? { createdAt: 1 as const }
      : { createdAt: -1 as const };

    const [entries, total, categories] = await Promise.all([
      EntryModel.find(query)
        .sort(sortOrder)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EntryModel.countDocuments(query),
      EntryModel.aggregate([
        { $match: { userId, archived: { $ne: true } } },
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
      settings?.geminiApiKey
        ? await categorizeContent(contentForAI, [], {
            geminiApiKey: settings.geminiApiKey,
            maxTokens: settings.maxTokens ?? 1024,
            userCategories: settings.userCategories ?? [],
          })
        : { title: '', categories: [{ name: 'Uncategorized', emoji: '📌' }], tags: [], summary: content.slice(0, 120), insight: '', readingTime: 1 };

    const wordCount = content.split(/\s+/).length;
    const readingTime = categorization.readingTime ?? Math.max(1, Math.ceil(wordCount / 200));

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
      insight: categorization.insight ?? '',
      readingTime,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error('[POST /api/entries]', err);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const deleteAll = searchParams.get('all');

    if (deleteAll === 'true') {
      await EntryModel.deleteMany({ userId });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Specify ?all=true' }, { status: 400 });
  } catch (err) {
    console.error('[DELETE /api/entries]', err);
    return NextResponse.json({ error: 'Failed to delete entries' }, { status: 500 });
  }
}
