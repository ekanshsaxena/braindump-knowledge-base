import Anthropic from '@anthropic-ai/sdk';
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
  "summary": "..."
}

TITLE: 5–8 word descriptive title capturing the core subject. Not a sentence — just a noun phrase.

CATEGORIES:
- Map to every matching user category listed above
- Also create specific new sub-categories when useful (e.g. grant content → include "Startup" from user list AND add new "Funding & Grants")
- 2–4 words per category name, at least one category always

TAGS: Up to 50 tags — include main topics, subtopics, specific scheme names, amounts, places, organizations, key concepts, and any term someone might search for. Mix single words and short phrases.

SUMMARY: Reformat into structured markdown. Use ## headings for sections, - for bullets, numbered lists where order matters, **bold** for key terms. Preserve EVERY detail — all numbers, names, schemes, amounts, and URLs exactly as-is. Do not shorten or omit anything.`;
}

function buildUserPrompt(content: string): string {
  return `Categorize and summarize this content:\n\n${content}`;
}

function stripLeadingEmoji(str: string): string {
  // Remove any leading emoji / non-word characters so names stay text-only
  return str.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
}

function extractJSON(raw: string): CategorizeResult {
  // Strip markdown code fences (Gemini often wraps output in ```json ... ```)
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error('[extractJSON] Raw response:', raw.slice(0, 500));
    throw new Error('No JSON object found in response');
  }
  const parsed = JSON.parse(stripped.slice(start, end + 1)) as CategorizeResult;
  // Ensure category names never contain the emoji (AI sometimes puts emoji in both fields)
  if (Array.isArray(parsed.categories)) {
    parsed.categories = parsed.categories.map((c) => ({
      emoji: c.emoji?.trim() ?? '📌',
      name: stripLeadingEmoji(c.name ?? ''),
    }));
  }
  return parsed;
}

async function categorizeWithAnthropic(
  apiKey: string,
  content: string,
  userCategories: UserCategory[],
  maxTokens: number
): Promise<CategorizeResult> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system: buildSystemPrompt(userCategories),
    messages: [{ role: 'user', content: buildUserPrompt(content) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return extractJSON(text);
}

async function categorizeWithGemini(
  apiKey: string,
  content: string,
  userCategories: UserCategory[],
  maxTokens: number
): Promise<CategorizeResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    // thinkingBudget:0 disables internal reasoning tokens so the full maxOutputTokens
    // budget is available for the actual JSON response (otherwise thinking burns it all)
    // Use at least 4096 tokens: 1024 default is too small once you account for
    // structured markdown summary + up to 50 tags wrapped in a JSON object.
    generationConfig: { maxOutputTokens: Math.max(maxTokens, 4096), thinkingConfig: { thinkingBudget: 0 } } as Parameters<typeof genAI.getGenerativeModel>[0]['generationConfig'],
  });

  const prompt = `${buildSystemPrompt(userCategories)}\n\n${buildUserPrompt(content)}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return extractJSON(raw);
}

export async function categorizeContent(
  content: string,
  _existingCategories: string[],
  settings: {
    anthropicApiKey: string;
    geminiApiKey: string;
    priority: 'anthropic' | 'gemini';
    maxTokens: number;
    userCategories: UserCategory[];
  }
): Promise<CategorizeResult> {
  const { anthropicApiKey, geminiApiKey, priority, maxTokens, userCategories } = settings;

  const primary = priority === 'anthropic'
    ? { key: anthropicApiKey, fn: categorizeWithAnthropic }
    : { key: geminiApiKey, fn: categorizeWithGemini };

  const fallback = priority === 'anthropic'
    ? { key: geminiApiKey, fn: categorizeWithGemini }
    : { key: anthropicApiKey, fn: categorizeWithAnthropic };

  if (primary.key) {
    try {
      return await primary.fn(primary.key, content, userCategories, maxTokens);
    } catch (err) {
      console.error(`Primary AI (${priority}) failed:`, err);
    }
  }

  if (fallback.key) {
    try {
      return await fallback.fn(fallback.key, content, userCategories, maxTokens);
    } catch (err) {
      console.error(`Fallback AI failed:`, err);
    }
  }

  return {
    title: '',
    categories: [{ name: 'Uncategorized', emoji: '📌' }],
    tags: [],
    summary: content,
  };
}
