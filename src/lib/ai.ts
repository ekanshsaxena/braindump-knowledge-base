import { CategorizeResult, UserCategory } from '@/types';

function buildSystemPrompt(userCategories: UserCategory[]): string {
  const userCatList = userCategories.length > 0
    ? `\nUser's defined interest categories (map to ALL that match):\n${userCategories.map(c => `  - ${c.emoji} ${c.name}`).join('\n')}\n`
    : '';

  return `You are a smart personal knowledge base assistant that categorizes notes, learnings, and saved resources.
${userCatList}
Respond with ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object:
{
  "title": "Short descriptive title (5–8 words max)",
  "categories": [{"name": "Text only — NO emoji in name", "emoji": "single emoji char"}],
  "tags": ["tag1", "tag2", ...up to 50 tags],
  "summary": "...",
  "insight": "one sentence — the single most important thing to remember from this content",
  "readingTime": <number of minutes to read the summary, minimum 1>
}

TITLE: 5–8 word descriptive title capturing the core subject. Not a sentence — just a noun phrase.
CATEGORIES: Map to matching user categories. Also create specific sub-categories. 2–4 words per name.
TAGS: Up to 50 — topics, names, organizations, key concepts. Mix single words and short phrases.
SUMMARY: Structured markdown. ## headings, - bullets, **bold** key terms. Preserve ALL details.
INSIGHT: One concise sentence, max 20 words.
READING_TIME: word_count / 200, rounded up, minimum 1.`;
}

function stripLeadingEmoji(str: string): string {
  return str.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
}

function extractJSON(raw: string): CategorizeResult {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error('[extractJSON] Raw response:', raw.slice(0, 500));
    throw new Error('No JSON object found in response');
  }
  const parsed = JSON.parse(stripped.slice(start, end + 1)) as CategorizeResult;
  if (Array.isArray(parsed.categories)) {
    parsed.categories = parsed.categories.map((c) => ({
      emoji: c.emoji?.trim() ?? '📌',
      name: stripLeadingEmoji(c.name ?? ''),
    }));
  }
  return parsed;
}

export async function categorizeContent(
  content: string,
  _existingCategories: string[],
  settings: {
    geminiApiKey: string;
    maxTokens: number;
    userCategories: UserCategory[];
  }
): Promise<CategorizeResult> {
  const { geminiApiKey, maxTokens, userCategories } = settings;

  if (!geminiApiKey) {
    return { title: '', categories: [{ name: 'Uncategorized', emoji: '📌' }], tags: [], summary: content, insight: '', readingTime: 1 };
  }

  const prompt = `${buildSystemPrompt(userCategories)}\n\nCategorize and summarize this content:\n\n${content}`;

  // Use direct REST fetch so we can optionally route through CF AI Gateway (set CF_AI_GATEWAY_URL env var)
  // to bypass Gemini's regional restrictions from CF Workers in India.
  const gatewayBase = process.env.CF_AI_GATEWAY_URL?.replace(/\/$/, '');
  const apiUrl = gatewayBase
    ? `${gatewayBase}/google-ai-studio/v1beta/models/gemini-2.5-flash:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (gatewayBase) headers['x-goog-api-key'] = geminiApiKey;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: Math.max(maxTokens, 4096),
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!raw) throw new Error('Empty Gemini response');

  return extractJSON(raw);
}
