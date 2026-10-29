import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const entry = await EntryModel.findOne({ _id: id, userId }).lean();
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err) {
    console.error('[GET /api/entries/:id]', err);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const allowed = ['content', 'tags', 'pinned', 'archived', 'title', 'summary', 'insight', 'categories', 'readingTime'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.content !== undefined) update.editedAt = new Date();

    const entry = await EntryModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    ).lean();

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err) {
    console.error('[PATCH /api/entries/:id]', err);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    await EntryModel.findOneAndDelete({ _id: id, userId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/entries/:id]', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
