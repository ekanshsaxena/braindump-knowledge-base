import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';

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
