import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';

export async function PATCH(req: Request, { params }: { params: Promise<{ tag: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { tag } = await params;
    const oldTag = decodeURIComponent(tag);
    const { newName } = await req.json();

    if (!newName?.trim()) {
      return NextResponse.json({ error: 'newName required' }, { status: 400 });
    }

    await EntryModel.updateMany(
      { userId, tags: oldTag },
      { $set: { 'tags.$[el]': newName.trim() } },
      { arrayFilters: [{ el: oldTag }] }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/tags/:tag]', err);
    return NextResponse.json({ error: 'Failed to rename tag' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ tag: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { tag } = await params;
    const tagName = decodeURIComponent(tag);

    await EntryModel.updateMany(
      { userId, tags: tagName },
      { $pull: { tags: tagName } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tags/:tag]', err);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
