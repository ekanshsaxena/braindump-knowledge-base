import { NextResponse } from 'next/server';
import { fetchUrlMetadata } from '@/lib/metadata';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    const metadata = await fetchUrlMetadata(url);
    return NextResponse.json(metadata ?? { error: 'Could not fetch metadata' });
  } catch (err) {
    console.error('[POST /api/metadata]', err);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
