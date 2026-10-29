import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const tags = await EntryModel.aggregate([
      { $match: { userId, archived: { $ne: true } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    return NextResponse.json({ tags });
  } catch (err) {
    console.error('[GET /api/tags]', err);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
