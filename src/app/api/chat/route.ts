import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EntryModel from '@/models/Entry';
import Settings from '@/models/Settings';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    await connectDB();
    const { question, history = [] }: { question: string; history: HistoryItem[] } = await req.json();

    if (!question?.trim()) {
      return new Response('Question required', { status: 400 });
    }

    // Get user's Gemini key
    const settings = await Settings.findOne({ userId }).lean();
    if (!settings?.geminiApiKey) {
      return streamText("I can't answer questions yet — you haven't added a Gemini API key in Settings.");
    }

    // RAG: search entries by full-text
    let entries = await EntryModel.find(
      { userId, archived: { $ne: true }, $text: { $search: question } },
      { score: { $meta: 'textScore' }, title: 1, insight: 1, summary: 1, tags: 1, categories: 1, url: 1, _id: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(8)
      .lean();

    // Fallback: keyword-based tag search if full-text returns <3 results
    if (entries.length < 3) {
      const keywords = question
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (keywords.length > 0) {
        const extra = await EntryModel.find(
          { userId, archived: { $ne: true }, tags: { $in: keywords } },
          { title: 1, insight: 1, summary: 1, tags: 1, categories: 1, url: 1, _id: 1 }
        )
          .limit(6)
          .lean();

        const existingIds = new Set(entries.map((e) => String(e._id)));
        const newEntries = extra.filter((e) => !existingIds.has(String(e._id)));
        entries = [...entries, ...newEntries].slice(0, 8);
      }
    }

    // No entries found
    if (entries.length === 0) {
      return streamText(
        "I don't have any information about that in your brain yet. Try saving some notes or links related to this topic first!"
      );
    }

    // Build context
    const citations = entries.map((e, i) => ({
      id: String(e._id),
      title: (e.title as string) || `Entry ${i + 1}`,
      index: i + 1,
    }));

    const contextBlocks = entries.map((e, i) => {
      const parts = [`[${i + 1}] **${e.title || 'Note'}**`];
      if (e.insight) parts.push(`Key takeaway: ${e.insight}`);
      const summary = (e.summary as string) ?? '';
      if (summary) parts.push(summary.slice(0, 600));
      return parts.join('\n');
    });

    const systemPrompt = `You are answering questions from a personal knowledge base (second brain).
Answer ONLY based on the provided context entries.
Cite sources inline as [1], [2] etc. matching the entry numbers.
If the context doesn't fully answer the question, say what you know and what's missing.
Be concise but complete. Use markdown formatting.

Context entries:
${contextBlocks.join('\n\n---\n\n')}`;

    const conversationHistory = history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
      parts: [{ text: m.content }],
    }));

    const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } } as Parameters<typeof genAI.getGenerativeModel>[0]['generationConfig'],
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: conversationHistory });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat.sendMessageStream(question);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          // Append citations as final JSON line
          controller.enqueue(
            encoder.encode('\n' + JSON.stringify({ citations: citations.map((c) => ({ id: c.id, title: c.title })) }))
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[POST /api/chat]', err);
    return new Response('Internal error', { status: 500 });
  }
}

function streamText(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.enqueue(encoder.encode('\n' + JSON.stringify({ citations: [] })));
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
