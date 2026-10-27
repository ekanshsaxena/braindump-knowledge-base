import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import Settings from '@/models/Settings';

const DEFAULT: Record<string, unknown> = {
  geminiApiKey: '',
  maxTokens: 1024,
  userCategories: [],
  onboardingCompleted: false,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const settings = await Settings.findOne({ userId }).lean();
    if (!settings) return NextResponse.json(DEFAULT);

    return NextResponse.json({
      geminiApiKey: settings.geminiApiKey ?? '',
      maxTokens: settings.maxTokens ?? 1024,
      userCategories: settings.userCategories ?? [],
      onboardingCompleted: settings.onboardingCompleted ?? false,
    });
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json(DEFAULT);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.geminiApiKey !== undefined) update.geminiApiKey = body.geminiApiKey;
    if (body.maxTokens !== undefined) update.maxTokens = Number(body.maxTokens) || 1024;
    if (body.userCategories !== undefined) update.userCategories = body.userCategories;
    if (body.onboardingCompleted !== undefined) update.onboardingCompleted = body.onboardingCompleted;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { ...update, userId } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      geminiApiKey: settings.geminiApiKey ?? '',
      maxTokens: settings.maxTokens ?? 1024,
      userCategories: settings.userCategories ?? [],
      onboardingCompleted: settings.onboardingCompleted ?? false,
    });
  } catch (err) {
    console.error('[POST /api/settings]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
