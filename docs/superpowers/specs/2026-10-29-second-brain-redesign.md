# Second Brain — Full Redesign Design Document
**Date:** 2026-10-29  
**Stack:** Next.js 16 · TypeScript · MongoDB/Mongoose · Clerk · Gemini 2.5 Flash · Cloudflare Workers

---

## Intent & Why

A personal knowledge management app that acts as a user's **second brain**. Users dump raw thoughts, URLs, and half-formed ideas in natural language. AI does the heavy lifting: summarises, categorises, tags, and reformats everything into structured knowledge. Users can then browse, search, and most importantly **ask questions** — and get answers grounded in what they've saved.

The north star: **it should feel like talking to your own memory**.

---

## Goals

1. Frictionless capture — paste anything, get structured knowledge back in seconds
2. AI that genuinely understands and surfaces connections between saved items
3. Conversational interface: ask "what did I save about Kubernetes?" and get a precise answer with citations
4. Rich browse experience with filtering, search, tag cloud, category sidebar
5. Full entry management: view, edit, pin, archive, delete
6. Premium, animated UI that feels more like a product than a tool

---

## Non-Goals

- Real-time collaboration / multi-user
- Native mobile app (responsive web is fine)
- File upload / attachment storage (images, PDFs)
- Offline mode
- Public sharing of entries

---

## Anti-Goals (would make this a failure)

- Slow AI responses that break flow
- UI that looks like a generic dashboard template
- Chat that makes up answers not grounded in saved entries
- Losing existing user data during migration

---

## Constraints

- Must deploy on Cloudflare Workers via OpenNext (no long-running processes)
- MongoDB M0 free tier (small connection pool, short timeouts)
- All AI via Gemini 2.5 Flash (no Anthropic)
- Auth via Clerk (existing)
- CF Workers execution limit: ~30s per request

---

## Feature Breakdown

### 1. Capture Bar (Enhanced)

**What it is:** The primary input widget at the top of Browse view.

**Behaviour:**
- Auto-detects URLs in pasted text; shows a "fetching metadata…" pill indicator
- Fetches OG metadata + full page text extract via `open-graph-scraper` (existing) — add a best-effort full body text fetch for richer AI context
- Accepts plain text, URL-only, or mixed (text + URL)
- Keyboard shortcut: `N` when not in input focus opens capture bar
- Shows character count; warns at 10,000 chars
- Draft persisted in localStorage until saved
- Save button shows spinner with "Thinking…" → "Categorising…" → "Saved" state

### 2. AI Processing Pipeline (Enhanced)

**What it does:** Runs on every new entry before storing.

**Steps:**
1. URL detection → fetch OG metadata (title, description, image, site name)
2. If URL: attempt to fetch page body text (first 4,000 chars) for richer context
3. Send to Gemini: generate title, categories, up to 50 tags, structured markdown summary, and a one-line "insight" (new field)
4. Store all of this in MongoDB

**New fields on Entry model:**
- `insight: string` — one-sentence key takeaway (AI-generated)
- `sourceContent: string` — extracted page body (stored, used for chat RAG)
- `pinned: boolean` — default false
- `archived: boolean` — default false
- `editedAt: Date` — set on manual edits
- `readingTime: number` — estimated minutes to read (derived from summary length)

**AI Prompt improvements:**
- System prompt now explicitly instructs: create the insight field, map to user's defined categories, add domain-specific tags (tech, finance, health etc.), preserve all specific numbers/names/dates in summary

### 3. Browse Mode (Full Redesign)

**Layout:** Left sidebar (categories + tags) + main content area

**Sidebar (left, 240px):**
- App logo + branding at top
- **Browse** and **Chat** nav tabs with keyboard shortcuts (⌘1, ⌘2)
- CATEGORIES section: category name + emoji + count; selected = violet highlight
- TAGS section: scrollable tag cloud — each tag is a pill with count; click to filter; "show all" toggle if >20 tags
- Entry total count at bottom of sidebar
- Pinned entries shortcut (star icon, shows count)

**Main content:**
- Header: search bar (full-width, ⌘K shortcut), view toggle (card/list), sort dropdown (newest, oldest, most-tagged), filter chips showing active filters
- Entry count + filter summary
- **Card view:** 2-4 column responsive grid. Cards show: category pills, title, insight (1-line), tags (first 3 + "+N more"), timestamp, source domain (if URL)
- **List view:** single column. Each row: category dot, title, insight, tag pills, timestamp. Compact, scannable.
- Skeleton loaders while fetching
- Infinite scroll (load 20 more on scroll to bottom, via `IntersectionObserver`)
- Empty state with illustration and "Dump your first thought" CTA
- Pinned entries section at top (collapsible) when pins exist

**Card hover state:**
- Subtle scale-up (1.02) + shadow lift
- Action icons appear: pin, archive, delete
- Click opens Entry Detail modal

### 4. Entry Detail Modal

**Triggered by:** Single click on card/list item

**Layout:** Full-screen overlay modal with glassmorphism background

**Content:**
- Category pills + emoji at top
- Large title
- Insight callout (styled highlight box)
- Full AI-generated markdown summary (rendered with `react-markdown` + `remark-gfm`)
- Source URL card (if URL entry): shows favicon, site name, title, thumbnail, "Open original" button
- Tags: all tags as clickable pills (clicking closes modal, filters by that tag)
- Metadata footer: created, last edited, reading time, word count
- **Related Entries:** AI similarity or tag overlap — show 2-3 cards
- Actions: Edit, Pin/Unpin, Archive, Delete, Copy markdown, Share link (future)

**Edit mode (in-modal):**
- Click Edit → textarea appears with original content pre-filled
- User edits raw text → click "Re-process with AI" → re-runs full AI pipeline
- Or "Save as-is" without re-processing
- Updates `editedAt`

### 5. AI Chat Interface

**Nav:** Chat tab (⌘2) in sidebar

**Layout:** Two-panel — sidebar stays, main area becomes chat interface

**Chat behaviour:**
- Input at bottom: textarea with send button + ⌘↵ shortcut
- Messages scroll up; newest at bottom
- User messages: right-aligned, violet background
- AI messages: left-aligned, dark card with markdown rendering
- AI responses are **streamed** (character by character appearance)
- Each AI response includes **citations**: inline footnote numbers linking to the source entries

**RAG approach:**
- On user question: search MongoDB full-text index for relevant entries (existing `$text` search)
- Also filter by category/tag if question mentions them ("what did I save about React?")
- Pass top 5–8 matching entries as context to Gemini with the question
- System prompt instructs Gemini to answer ONLY from the provided context, cite entry titles, and say "I don't have information about that in your brain" if no relevant entries found
- Show source entry pills below each AI answer (clickable → opens Entry Detail)

**Streaming implementation:**
- Gemini SDK supports streaming; use `model.generateContentStream()`
- Stream to client via Next.js Route Handler + `TransformStream`
- Client reads with `ReadableStream` and appends to message state

**Chat persistence:**
- Store last 20 messages in `localStorage` (no server-side chat history for now)
- Clear chat button

### 6. Command Palette (⌘K)

**Trigger:** ⌘K anywhere in the app

**Built with:** `cmdk` library

**Contents:**
- Search across all entries (live, debounced)
- Quick actions: New entry (N), Open chat (⌘2), Settings (,), Toggle theme
- Recent entries (last 5 viewed)
- Category shortcuts: "Show Finance", "Show Software Engineering" etc.
- Keyboard navigable, Escape closes

### 7. Tag Management

**Access:** Settings → Tags tab OR inline from entry detail

**Features:**
- List all tags with counts
- Click tag → rename inline
- Delete tag (removes from all entries)
- Merge tags: "merge 'react' into 'React'" → updates all entries
- Search tags field

### 8. Category Management (Enhanced)

**Access:** Settings → Categories tab (existing, enhanced)

**Enhancements:**
- Drag-to-reorder categories
- Color picker for each category dot (not just emoji)
- "Hide category" toggle (keeps data, hides from sidebar)
- Category stats: entry count, most recent entry date, most common tags within category

### 9. Settings (Enhanced)

**Tabs:** AI Providers · Categories · Tags · Appearance · Account

**AI Providers tab:**
- Gemini API key field (existing)
- Max tokens (existing)
- Toggle: "Always re-process AI on edit" (default: off)
- AI behavior slider: "Concise summaries" ↔ "Detailed summaries"

**Appearance tab:**
- Theme: Dark (default) / Light / System
- Default view: Card / List
- Compact mode toggle (reduces card padding, font size)
- Sidebar collapsed by default toggle

**Account tab:**
- User avatar + email (from Clerk)
- Export all entries as JSON
- Export all entries as Markdown zip
- Danger zone: Delete all entries, Delete account

### 10. Search (Enhanced)

**Full-text search:** MongoDB `$text` index (existing)

**Filters (chainable):**
- Category filter (multi-select)
- Tag filter (multi-select)
- Date range picker (last 7d / 30d / 90d / custom)
- Entry type: All / URL-only / Text-only
- Pinned only toggle

**Results:**
- Search term highlighted in title/insight
- Result count shown
- Clear all filters button

---

## New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST (streaming) | RAG chat — accepts question + recent messages |
| `/api/entries` | GET | Enhanced: supports tag[], type, pinned, archived, dateFrom, dateTo filters |
| `/api/entries/[id]` | GET | Full entry detail (existing route, add sourceContent) |
| `/api/entries/[id]` | PATCH | Update content/tags/pinned/archived |
| `/api/tags` | GET | All tags with counts |
| `/api/tags/[tag]` | PATCH | Rename tag (updates all entries) |
| `/api/tags/[tag]` | DELETE | Delete tag (removes from all entries) |
| `/api/export` | GET | Export entries as JSON |

---

## Data Model Changes

### Entry (additions only — no breaking changes)

```typescript
interface Entry {
  // existing fields unchanged
  insight?: string;          // AI: one-sentence key takeaway
  sourceContent?: string;    // Raw text extracted from URL (first 4000 chars)
  pinned?: boolean;          // default false
  archived?: boolean;        // default false
  editedAt?: Date;           // set when user manually edits
  readingTime?: number;      // estimated minutes
}
```

### MongoDB Index additions

```js
// Full-text search on summary + tags + title (improve existing)
EntrySchema.index({ title: 'text', summary: 'text', tags: 'text', insight: 'text' });

// For tag queries
EntrySchema.index({ 'tags': 1 });

// For pinned/archived queries
EntrySchema.index({ userId: 1, pinned: 1 });
EntrySchema.index({ userId: 1, archived: 1 });
```

---

## UI Design System

**Color Palette:**
- Background: `#0a0a0f` (near-black with blue tint)
- Surface: `#12121a` (cards, sidebar)
- Surface raised: `#1a1a26` (hover state)
- Border: `rgba(255,255,255,0.08)`
- Accent primary: `#7c3aed` (violet-600)
- Accent glow: `rgba(124, 58, 237, 0.15)` (for shadows)
- Text primary: `#f1f0ff`
- Text secondary: `rgba(255,255,255,0.5)`
- Tag pill: `rgba(124, 58, 237, 0.12)` bg + `rgba(124, 58, 237, 0.6)` border

**Typography:**
- Font: Geist (already loaded)
- Hero heading: 48-72px, weight 800, tight letter-spacing
- Section heading: 20px, weight 600
- Body: 14px, weight 400, line-height 1.6
- Tag/label: 11px, weight 600, uppercase letter-spacing

**Motion Design (Framer Motion):**
- Page transitions: fade + slight upward slide (y: 16 → 0, opacity 0 → 1, duration 0.3s)
- Card mount: stagger 0.03s per card, y: 20 → 0
- Modal open: scale 0.95 → 1 + fade, spring physics
- Sidebar collapse: width animation 240 → 0 (existing, keep)
- Chat message appear: slide in from bottom + fade
- Entry delete: scale → 0 + fade out, gap closes smoothly
- Loading skeleton: shimmer gradient animation
- Hover on cards: scale 1 → 1.02, box-shadow increases
- Tag pill hover: background opacity increases + slight scale
- Button press: scale 0.97 + slight darken

**New Libraries:**
- `cmdk` — command palette
- `@radix-ui/react-dialog` — accessible modal
- `@radix-ui/react-dropdown-menu` — dropdowns
- `@radix-ui/react-tabs` — tabs in settings
- `remark-gfm` — GitHub-flavored markdown tables/strikethrough
- `react-syntax-highlighter` — code blocks in summaries
- `date-fns` — relative time ("3 days ago")

---

## Implementation Build Order

1. **Data layer:** Update Entry model + indexes, new Tag API routes, PATCH entry route
2. **AI pipeline:** Add `insight`, `sourceContent` fields to processing, update prompts
3. **Design system:** CSS custom properties, global styles, shared tokens
4. **Layout shell:** New sidebar with Browse/Chat tabs, nav, collapse
5. **Enhanced Browse:** Card/list view toggle, infinite scroll, tag cloud, filter chips
6. **Entry Detail Modal:** Full-screen modal with all sections
7. **AI Chat:** Route handler with streaming, RAG, citations, client chat UI
8. **Command Palette:** ⌘K with cmdk
9. **Tag Management:** Settings tab with rename/delete/merge
10. **Search enhancements:** Multi-filter support, date range, type filter
11. **Settings:** New tabs (Appearance, Account, Tags)
12. **Polish pass:** Animation timing, empty states, error states, mobile responsiveness

---

## Builder Calls (Design Decisions Made)

- **No embedding vectors for RAG** — using MongoDB full-text search + keyword extraction. Vectors require a vector DB (Pinecone/Atlas Vector Search) which adds cost and complexity. Full-text search is good enough for hundreds of entries. *Can be upgraded later.*
- **Chat history in localStorage only** — no server-side persistence for chat. Keeps model simple, no new collection needed.
- **Streaming via Route Handler + ReadableStream** — not Server Actions, as streaming from Server Actions has CF Workers limitations.
- **`react-markdown`** already in project; adding `remark-gfm` for table support.
- **No drag-and-drop reorder** for entries themselves — too much complexity for v1.
- **Export as JSON only** for v1, Markdown zip is stretch goal.
- **`@radix-ui`** for accessible primitives rather than building modals/dialogs from scratch.
