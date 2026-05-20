import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { categorizeContent } from '@/lib/ai';
import Settings from '@/models/Settings';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const settings = await Settings.findOne({ userId }).lean();
    if (!settings?.anthropicApiKey && !settings?.geminiApiKey) {
      return NextResponse.json({
        categories: [{ name: 'Uncategorized', emoji: '📌' }],
        tags: [],
        summary: content.slice(0, 120),
      });
    }

    const result = await categorizeContent(content, settings?.userCategories ?? [], settings);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/categorize]', err);
    return NextResponse.json({ error: 'Categorization failed' }, { status: 500 });
  }
}
