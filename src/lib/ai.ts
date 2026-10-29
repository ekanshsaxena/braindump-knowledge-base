import { GoogleGenerativeAI } from '@google/generative-ai';
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

CATEGORIES:
- Map to every matching user category listed above
- Also create specific new sub-categories when useful
- 2–4 words per category name, at least one category always

TAGS: Up to 50 tags — include main topics, subtopics, specific names, amounts, places, organizations, key concepts.

SUMMARY: Reformat into structured markdown. Use ## headings, - for bullets, **bold** for key terms. Preserve ALL details.

INSIGHT: One concise sentence capturing the key takeaway. Max 20 words.

READING_TIME: Estimate minutes to read the SUMMARY (word count / 200, rounded up, minimum 1).`;
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

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  // gemini-1.5-flash: broader regional availability, no thinkingConfig needed
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { maxOutputTokens: Math.max(maxTokens, 4096), temperature: 0.2 },
  });

  const prompt = `${buildSystemPrompt(userCategories)}\n\nCategorize and summarize this content:\n\n${content}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return extractJSON(raw);
}
