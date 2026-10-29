import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const entries = await EntryModel.find(
      { userId, archived: { $ne: true } },
      { sourceContent: 0, __v: 0, userId: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();

    const json = JSON.stringify(entries, null, 2);

    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="braindump-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/export]', err);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
