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
    if (!settings?.geminiApiKey) {
      return NextResponse.json({
        categories: [{ name: 'Uncategorized', emoji: '📌' }],
        tags: [],
        summary: content.slice(0, 120),
      });
    }

    try {
      const result = await categorizeContent(content, settings?.userCategories ?? [], settings);
      return NextResponse.json(result);
    } catch (aiErr) {
      console.error('[POST /api/categorize] AI failed:', aiErr instanceof Error ? aiErr.message : aiErr);
      return NextResponse.json({
        categories: [{ name: 'Uncategorized', emoji: '📌' }],
        tags: [],
        summary: content.slice(0, 120),
        insight: '',
        readingTime: 1,
      });
    }
  } catch (err) {
    console.error('[POST /api/categorize]', err);
    return NextResponse.json({ error: 'Categorization failed' }, { status: 500 });
  }
}
