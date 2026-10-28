# Second Brain Full Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app into a feature-rich second-brain with AI chat, tag cloud, entry detail modal, command palette, and premium animated UI.

**Architecture:** Existing Next.js 16 + Mongoose + Clerk + Gemini stack. New features layer on top of the existing schema (additive model fields only). UI is completely replaced: new layout shell, new components, new design system. AI chat uses MongoDB full-text search for RAG — no vector DB.

**Tech Stack:** Next.js 16, TypeScript, MongoDB/Mongoose, Clerk, Gemini 2.5 Flash, Framer Motion, Tailwind CSS, cmdk, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-tabs, remark-gfm, date-fns

**Spec:** `docs/superpowers/specs/2026-10-29-second-brain-redesign.md`

## Global Constraints

- Deploy target: Cloudflare Workers via OpenNext — no Node.js built-ins unavailable in `nodejs_compat_v2`
- MongoDB M0 free tier — `maxPoolSize: 5`, all queries must complete in <10s
- All new Mongoose schema fields are optional with defaults — zero breaking changes to existing data
- Gemini 2.5 Flash only for AI — no Anthropic
- Auth via Clerk — every API route starts with `const { userId } = await auth(); if (!userId) return 401`
- `serverExternalPackages: ['mongoose']` in next.config.ts — mongoose not bundled, all other deps bundled
- CF Workers 30s execution limit — streaming responses use `ReadableStream` + `TransformStream`
- Existing files not in task scope must not change (backward compatibility)

## Review Focus

1. **Chat RAG with empty knowledge base** — user asks a question before saving any entries; `/api/chat` must return a graceful "nothing saved yet" message, not throw
2. **Streaming response halted mid-word** — client closes tab while `/api/chat` streams; server-side stream must not leak or crash the Worker
3. **Tag rename race condition** — two concurrent PATCH requests to `/api/tags/[tag]` rename the same tag to different values; MongoDB `updateMany` is not atomic across documents, last write wins silently
4. **Entry modal with no summary** — entries saved before the AI pipeline ran (DB error during creation) have no `summary`, `insight`, `tags`; modal must not crash on undefined fields
5. **Infinite scroll at exact page boundary** — when total entries is exactly a multiple of 20, the IntersectionObserver fires one extra fetch that returns an empty array; UI must stop loading without flicker

---

## File Structure

### New files to create
```
src/
  app/
    api/
      chat/route.ts              # Streaming RAG chat endpoint
      tags/route.ts              # GET all tags with counts
      tags/[tag]/route.ts        # PATCH rename, DELETE tag
      export/route.ts            # GET entries as JSON
    chat/page.tsx                # Chat route (renders ChatInterface)
  components/
    layout/
      AppShell.tsx               # Root layout: sidebar + main
      Sidebar.tsx                # Nav tabs, categories, tag cloud
      TagCloud.tsx               # Tag pills with counts
    entries/
      EntryCard.tsx              # Card view item (replaces old)
      EntryListItem.tsx          # List view item
      EntryGrid.tsx              # Card/list toggle + infinite scroll
      EntryDetailModal.tsx       # Full-screen entry detail
      EntryEditForm.tsx          # Edit mode inside modal
    chat/
      ChatInterface.tsx          # Full chat UI
      ChatMessage.tsx            # Single message bubble
      CitationPills.tsx          # Source entry links below AI msg
    capture/
      DumpBox.tsx                # Enhanced capture bar (replaces old)
    search/
      FilterBar.tsx              # Active filter chips + sort + view toggle
      CommandPalette.tsx         # ⌘K palette (uses cmdk)
    settings/
      SettingsShell.tsx          # Tabs wrapper (replaces SettingsForm)
      AITab.tsx                  # Gemini key + max tokens
      CategoriesTab.tsx          # Category management
      TagsTab.tsx                # Tag management (rename/delete/merge)
      AppearanceTab.tsx          # Theme + view + compact
      AccountTab.tsx             # User info + export + danger zone
    ui/
      Modal.tsx                  # Radix Dialog wrapper
      Toast.tsx                  # Keep existing
      SkeletonCard.tsx           # Loading skeleton
      SkeletonList.tsx           # Loading skeleton list
  hooks/
    useInfiniteEntries.ts        # Infinite scroll + filter state
    useCommandPalette.ts         # ⌘K open/close state
    useTheme.ts                  # Dark/light/system theme (extracted)
  lib/
    ai.ts                        # Modify: add insight + sourceContent to output
    mongodb.ts                   # No change
  models/
    Entry.ts                     # Modify: add new optional fields
  types/
    index.ts                     # Modify: extend Entry + add ChatMessage type
  styles/
    tokens.css                   # New: CSS custom properties design system
```

### Files to modify
```
src/app/layout.tsx               # Add AppShell, CommandPalette, global styles
src/app/page.tsx                 # Simplify: use EntryGrid + Sidebar
src/app/settings/page.tsx        # Replace SettingsForm with SettingsShell
src/app/api/entries/route.ts     # Add filter params: tag[], pinned, archived, type, dateFrom, dateTo
src/app/api/entries/[id]/route.ts # Add PATCH (update fields)
src/app/globals.css              # Import tokens.css, update base styles
src/models/Entry.ts              # Add optional fields
src/types/index.ts               # Extend types
next.config.ts                   # No change needed
```

---

## Task 1: Install Dependencies + Design Tokens

**Files:**
- Modify: `package.json`
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS custom properties available globally; all new packages importable

- [ ] **Step 1: Install new packages**

```bash
npm install cmdk @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs remark-gfm date-fns
```

- [ ] **Step 2: Create `src/styles/tokens.css`** with these exact custom properties:

```css
:root {
  --bg: #0a0a0f;
  --surface: #12121a;
  --surface-raised: #1a1a26;
  --border: rgba(255,255,255,0.08);
  --accent: #7c3aed;
  --accent-glow: rgba(124,58,237,0.15);
  --accent-dim: rgba(124,58,237,0.12);
  --accent-border: rgba(124,58,237,0.4);
  --text-primary: #f1f0ff;
  --text-secondary: rgba(255,255,255,0.5);
  --text-muted: rgba(255,255,255,0.25);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --sidebar-width: 240px;
  --header-height: 56px;
  --transition: 150ms cubic-bezier(0.16,1,0.3,1);
  --transition-slow: 300ms cubic-bezier(0.16,1,0.3,1);
}
```

- [ ] **Step 3: Import tokens.css in `src/app/globals.css`**

Add `@import '../styles/tokens.css';` at the top.

Update `body` background to use `var(--bg)` and color to `var(--text-primary)`.

- [ ] **Step 4: Verify build is clean**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```
Expected: No TypeScript or build errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/styles/tokens.css src/app/globals.css
git commit -m "feat: install deps + add design token system"
```

---

## Task 2: Data Model + New API Routes

**Files:**
- Modify: `src/models/Entry.ts`
- Modify: `src/types/index.ts`
- Modify: `src/app/api/entries/route.ts` (GET — add filters)
- Modify: `src/app/api/entries/[id]/route.ts` (add PATCH)
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/tags/[tag]/route.ts`
- Create: `src/app/api/export/route.ts`

**Interfaces:**
- Produces:
  - `Entry` type extended with: `insight?: string`, `sourceContent?: string`, `pinned?: boolean`, `archived?: boolean`, `editedAt?: Date`, `readingTime?: number`
  - `GET /api/entries` accepts query params: `tag` (repeatable), `pinned=true`, `archived=true`, `type=url|text`, `dateFrom=ISO`, `dateTo=ISO`
  - `PATCH /api/entries/[id]` body: `Partial<{ content, tags, pinned, archived }>` → returns updated entry
  - `GET /api/tags` → `{ tags: Array<{ name: string; count: number }> }`
  - `PATCH /api/tags/[tag]` body: `{ newName: string }` → renames tag in all entries
  - `DELETE /api/tags/[tag]` → removes tag from all entries
  - `GET /api/export` → JSON file download of all user entries

- [ ] **Step 1: Extend `src/models/Entry.ts`**

Add to `EntrySchema` (all optional):
```ts
insight: { type: String, default: '' },
sourceContent: { type: String, default: '' },
pinned: { type: Boolean, default: false, index: true },
archived: { type: Boolean, default: false, index: true },
editedAt: { type: Date },
readingTime: { type: Number, default: 0 },
```

Add compound indexes:
```ts
EntrySchema.index({ userId: 1, pinned: -1, createdAt: -1 });
EntrySchema.index({ userId: 1, archived: 1, createdAt: -1 });
EntrySchema.index({ 'tags': 1 });
```

- [ ] **Step 2: Extend `src/types/index.ts`**

Add to `Entry` interface: `insight?: string; sourceContent?: string; pinned?: boolean; archived?: boolean; editedAt?: string; readingTime?: number;`

Add new type:
```ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ id: string; title: string }>;
  timestamp: number;
}
```

- [ ] **Step 3: Update `GET /api/entries` in `src/app/api/entries/route.ts`**

Parse new query params and add to the `query` object:
- `tag`: `query['tags'] = { $in: searchParams.getAll('tag') }` (when present)
- `pinned=true`: `query.pinned = true`
- `archived=true`: `query.archived = true` (default query excludes archived: `query.archived = { $ne: true }`)
- `type=url`: `query.type = 'url'`; `type=text`: `query.type = 'text'`
- `dateFrom`/`dateTo`: `query.createdAt = { $gte: new Date(dateFrom), $lte: new Date(dateTo) }`

Default behavior (no `archived` param): add `query.archived = { $ne: true }` to hide archived entries.

- [ ] **Step 4: Add PATCH to `src/app/api/entries/[id]/route.ts`**

```ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // auth check, connectDB
  const body = await req.json();
  const allowed = ['content', 'tags', 'pinned', 'archived'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (body.content) update.editedAt = new Date();
  const entry = await EntryModel.findOneAndUpdate(
    { _id: params.id, userId },
    { $set: update },
    { new: true }
  ).lean();
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(entry);
}
```

- [ ] **Step 5: Create `src/app/api/tags/route.ts`**

```ts
export async function GET() {
  // auth + connectDB
  const tags = await EntryModel.aggregate([
    { $match: { userId, archived: { $ne: true } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
  ]);
  return NextResponse.json({ tags });
}
```

- [ ] **Step 6: Create `src/app/api/tags/[tag]/route.ts`**

`PATCH`: `EntryModel.updateMany({ userId, tags: tag }, { $set: { 'tags.$[el]': newName } }, { arrayFilters: [{ 'el': tag }] })`

`DELETE`: `EntryModel.updateMany({ userId, tags: tag }, { $pull: { tags: tag } })`

Decode `params.tag` with `decodeURIComponent`.

- [ ] **Step 7: Create `src/app/api/export/route.ts`**

Returns `Content-Disposition: attachment; filename="braindump-export.json"` with all non-archived entries as JSON array. Exclude `sourceContent` and `__v` fields.

- [ ] **Step 8: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```
Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/models/Entry.ts src/types/index.ts src/app/api/
git commit -m "feat: extend entry model, add tag/export API routes"
```

---

## Task 3: Enhanced AI Pipeline

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `src/app/api/entries/route.ts` (POST — use new AI output)

**Interfaces:**
- Consumes: `categorizeContent(content, existingCats, settings)` from Task 2's `settings` type
- Produces: `CategorizeResult` extended with `insight: string; sourceContent: string; readingTime: number`

- [ ] **Step 1: Extend `CategorizeResult` in `src/types/index.ts`**

Add `insight?: string; readingTime?: number;` to `CategorizeResult`.

- [ ] **Step 2: Update system prompt in `src/lib/ai.ts`**

Add to the JSON schema in the prompt:
```
"insight": "one sentence key takeaway — the single most important thing to remember"
```

Add to SUMMARY instructions: "Also compute READING_TIME as estimated minutes to read the summary (word_count / 200, rounded up, minimum 1)."

Add to the JSON response schema: `"readingTime": <number>`.

- [ ] **Step 3: Update `extractJSON` in `src/lib/ai.ts`**

Ensure `insight` and `readingTime` are preserved from parsed JSON (they pass through without transformation).

- [ ] **Step 4: Update `POST /api/entries` to store new fields**

After `categorizeContent` returns, spread additional fields into `EntryModel.create`:
```ts
insight: categorization.insight ?? '',
readingTime: categorization.readingTime ?? 1,
```

Compute `readingTime` fallback: `Math.max(1, Math.ceil((content.split(' ').length) / 200))` if AI doesn't return one.

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai.ts src/types/index.ts src/app/api/entries/route.ts
git commit -m "feat: AI pipeline outputs insight + readingTime fields"
```

---

## Task 4: App Shell + Sidebar

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TagCloud.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/hooks/useTheme.ts`

**Interfaces:**
- Produces:
  - `<AppShell>` — wraps children; renders Sidebar + `<main>` + `<CommandPalette>` (placeholder slot for Task 8)
  - `<Sidebar activeTab: 'browse'|'chat'; onTabChange: (tab) => void; categories: Category[]; tags: Tag[]; selectedCategory: string; selectedTag: string; onCategorySelect: (name) => void; onTagSelect: (name) => void; entryCount: number>`
  - `<TagCloud tags: Tag[]; selected: string; onSelect: (name) => void; maxVisible?: number>`
  - `useTheme()` → `{ theme: 'dark'|'light'; toggle: () => void; setTheme: (t) => void }`

- [ ] **Step 1: Create `src/hooks/useTheme.ts`**

Extract `useTheme` hook from `src/app/page.tsx`. Same logic, same localStorage key `'theme'`. Export as named export.

- [ ] **Step 2: Create `src/components/layout/TagCloud.tsx`**

Props: `{ tags: Array<{name:string;count:number}>; selected: string; onSelect: (name:string)=>void; maxVisible?: number }`

Renders tag pills. First `maxVisible` (default 20) shown; "Show all" toggle if more. Each pill: `var(--accent-dim)` bg, `var(--accent-border)` border, count badge. Selected: `var(--accent)` solid bg, white text. Use Framer Motion `layout` prop for smooth show/hide.

- [ ] **Step 3: Create `src/components/layout/Sidebar.tsx`**

Structure:
```
<aside> fixed left, width var(--sidebar-width), height 100vh, bg var(--surface)
  Logo/branding (top)
  Nav tabs: Browse (⌘1) | Chat (⌘2) — pill switcher
  ── CATEGORIES ──
  Category list (existing CategorySidebar logic, reimplemented inline)
  ── TAGS ──
  <TagCloud />
  ── bottom ──
  Entry count
</aside>
```

Collapse button: clicking sets `sidebarOpen` state (parent-controlled via prop). When collapsed, width = 0, overflow hidden.

- [ ] **Step 4: Create `src/components/layout/AppShell.tsx`**

```tsx
'use client';
// Props: { children: ReactNode; sidebar: ReactNode; commandPalette?: ReactNode }
// Renders: flex row. Sidebar (collapsible). <main> flex-1.
// Global keyboard handlers: Cmd+1 → navigate to '/', Cmd+2 → navigate to '/chat'
// Uses useRouter from next/navigation for tab switching
```

- [ ] **Step 5: Update `src/app/layout.tsx`**

Wrap `{children}` with `<AppShell>`. The sidebar data is fetched at the page level (Browse/Chat pages pass it down), not in the shell itself. Shell just provides layout structure.

- [ ] **Step 6: Verify build + visual check**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/ src/hooks/useTheme.ts src/app/layout.tsx
git commit -m "feat: app shell, sidebar, tag cloud components"
```

---

## Task 5: Browse Mode — Entry Grid + Capture Bar

**Files:**
- Create: `src/components/entries/EntryCard.tsx` (replaces existing)
- Create: `src/components/entries/EntryListItem.tsx`
- Create: `src/components/entries/EntryGrid.tsx`
- Create: `src/components/entries/SkeletonCard.tsx`
- Create: `src/components/search/FilterBar.tsx`
- Create: `src/components/capture/DumpBox.tsx` (replaces existing)
- Create: `src/hooks/useInfiniteEntries.ts`
- Modify: `src/app/page.tsx` (full rewrite using new components)
- Create: `src/app/chat/page.tsx` (stub — real chat in Task 7)

**Interfaces:**
- Consumes: `Entry` type, `Category` type, `GET /api/entries` with filter params
- Produces:
  - `<EntryCard entry: Entry; onOpen: (id:string)=>void; onPin: (id:string)=>void; onDelete: (id:string)=>void>`
  - `<EntryListItem>` same props
  - `<EntryGrid entries: Entry[]; loading: boolean; hasMore: boolean; onLoadMore: ()=>void; view: 'card'|'list'; onOpen: (id:string)=>void>`
  - `<FilterBar view: 'card'|'list'; onViewChange: (v)=>void; sort: string; onSortChange: (s)=>void; activeFilters: FilterState; onClearFilter: (key:string)=>void>`
  - `<DumpBox onEntryAdded: ()=>void>`
  - `useInfiniteEntries(filters: FilterState)` → `{ entries, categories, tags, total, loading, hasMore, loadMore, refresh }`

- [ ] **Step 1: Create `src/hooks/useInfiniteEntries.ts`**

```ts
interface FilterState {
  search?: string; category?: string; tag?: string;
  pinned?: boolean; type?: 'url'|'text'; sort?: 'newest'|'oldest';
}
```

Manages page state (starts at 1), fetches `/api/entries?page=N&...filters`, appends results. Returns `{ entries: Entry[]; categories: Category[]; tags: Tag[]; total: number; loading: boolean; hasMore: boolean; loadMore: ()=>void; refresh: ()=>void }`. `hasMore = entries.length < total`. Debounce search 350ms.

- [ ] **Step 2: Create `src/components/entries/SkeletonCard.tsx`**

Single animated skeleton card: `rounded-xl bg-[var(--surface)] animate-pulse h-48`. Used in loading state.

- [ ] **Step 3: Create `src/components/entries/EntryCard.tsx`**

Card layout (dark, rounded-xl, border var(--border), hover: scale 1.02 + shadow):
- Top: category pills (emoji + name, 2 max then "+N")
- Title: 16px semibold, 2-line clamp
- Insight: 13px secondary color, 1-line clamp
- Tags: first 3 pills + "+N more"
- Footer: source domain (if url), relative time (date-fns `formatDistanceToNow`)
- Hover: action icons appear (pin, delete) via Framer Motion opacity

Pin action calls `PATCH /api/entries/[id]` with `{ pinned: !entry.pinned }`.
Delete calls `DELETE /api/entries/[id]`.

- [ ] **Step 4: Create `src/components/entries/EntryListItem.tsx`**

Single row: `[category dot] [title — 1 line clamp] [insight — 1 line] [tags] [time]`. More compact than card. Same hover actions.

- [ ] **Step 5: Create `src/components/entries/EntryGrid.tsx`**

Props include `view`, `entries`, `loading`, `hasMore`, `onLoadMore`, `onOpen`.

Card view: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
List view: `flex flex-col gap-2`.

Infinite scroll: use `IntersectionObserver` on a sentinel div at the bottom. When sentinel enters viewport and `hasMore && !loading`, call `onLoadMore`. Guard: do not call if `hasMore` is false (prevents Review Focus #5 issue).

Loading: show 8 `<SkeletonCard>` on first load; show spinner at bottom for subsequent pages.

Stagger animation: each card mounts with `initial={{ opacity: 0, y: 16 }}`, `animate={{ opacity: 1, y: 0 }}`, delay `i * 0.03`.

- [ ] **Step 6: Create `src/components/search/FilterBar.tsx`**

Row: `[view toggle card/list] [sort dropdown: Newest|Oldest] [active filter chips]`

Active filter chips: one chip per active filter (category, tag, pinned, type). Each chip has an × to clear. Use Framer Motion `layout` for smooth chip add/remove.

- [ ] **Step 7: Create `src/components/capture/DumpBox.tsx`**

Same core logic as existing (POST to `/api/entries`), enhanced:
- Draft saved to `localStorage.setItem('braindump-draft', content)` on every keystroke; cleared on save
- Auto-detect URL in input: show "Fetching link preview…" pill while saving
- Saving states: "Saving…" → "Thinking…" → "Saved!" (300ms each transition)
- `N` key shortcut: focus DumpBox when not already in an input

- [ ] **Step 8: Full rewrite of `src/app/page.tsx`**

```tsx
'use client';
// Orchestrates: Sidebar data fetch, useInfiniteEntries, state for selectedCategory/Tag/filters/view
// Renders: <AppShell sidebar={<Sidebar .../>}><DumpBox/><FilterBar/><EntryGrid/></AppShell>
// Entry click → sets openEntryId state → renders <EntryDetailModal> (Task 6 slot: render null until Task 6)
// Pinned entries: separate section at top using entries.filter(e => e.pinned), collapsible
```

- [ ] **Step 9: Create `src/app/chat/page.tsx`** (stub)

```tsx
export default function ChatPage() {
  return <div className="flex items-center justify-center h-screen text-[var(--text-secondary)]">Chat coming soon…</div>;
}
```

- [ ] **Step 10: Verify build + browser smoke test**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
npm run dev &
# Open http://localhost:3000 — verify layout loads, entries render
```

- [ ] **Step 11: Commit**

```bash
git add src/components/entries/ src/components/search/ src/components/capture/ src/hooks/useInfiniteEntries.ts src/app/page.tsx src/app/chat/page.tsx
git commit -m "feat: browse mode, entry cards, infinite scroll, filter bar, enhanced dump box"
```

---

## Task 6: Entry Detail Modal

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/entries/EntryDetailModal.tsx`
- Create: `src/components/entries/EntryEditForm.tsx`
- Create: `src/components/entries/RelatedEntries.tsx`
- Modify: `src/app/page.tsx` — wire `openEntryId` to `<EntryDetailModal>`

**Interfaces:**
- Consumes: `Entry` type; `GET /api/entries/[id]`; `PATCH /api/entries/[id]`; `DELETE /api/entries/[id]`
- Produces:
  - `<Modal open: boolean; onClose: ()=>void; children: ReactNode>` — Radix Dialog wrapper with glassmorphism backdrop
  - `<EntryDetailModal entryId: string|null; onClose: ()=>void; onDeleted: (id:string)=>void; onTagFilter: (tag:string)=>void>`
  - `<EntryEditForm entry: Entry; onSave: (updated:Entry)=>void; onCancel: ()=>void>`
  - `<RelatedEntries currentId: string; tags: string[]; categoryName: string>` — fetches `/api/entries?tag=X&tag=Y` and excludes current; shows 2-3 cards

- [ ] **Step 1: Create `src/components/ui/Modal.tsx`**

Wraps `@radix-ui/react-dialog`. `Content` has:
- `position: fixed; inset: 0; z-index: 50; backdrop: blur(20px) bg black/60`
- Inner panel: `var(--surface)` bg, `var(--border)` border, `border-radius: var(--radius-xl)`, max-w-4xl, overflow-y-auto, max-h-90vh
- Framer Motion: `initial={{ opacity:0, scale:0.95 }}` → `animate={{ opacity:1, scale:1 }}`, spring physics

- [ ] **Step 2: Create `src/components/entries/EntryDetailModal.tsx`**

Fetches full entry from `/api/entries/[id]` on mount (GET route should return full entry including `sourceContent`). Guard for missing fields (Review Focus #4 — all optional fields must have fallbacks).

Layout:
1. Category pills at top
2. Large title (28px, bold)
3. Insight callout box (if `entry.insight` is non-empty): styled with `var(--accent-dim)` bg + violet left border
4. `<ReactMarkdown remarkPlugins={[remarkGfm]}>` for `entry.summary`
5. Source URL card (if `entry.url`): favicon + site name + title + "Open original" button
6. Tags: all tags as clickable pills → `onTagFilter(tag)` + close modal
7. Footer: created time, edited time (if editedAt), reading time, word count
8. Related entries section: `<RelatedEntries>`
9. Action bar at bottom: Edit | Pin/Unpin | Archive | Delete | Copy markdown

- [ ] **Step 3: Create `src/components/entries/EntryEditForm.tsx`**

Textarea pre-filled with `entry.content`. Two buttons: "Re-process with AI" (POST to `/api/entries` is not right — call `PATCH /api/entries/[id]` with new content, then call `/api/categorize` and PATCH with new categorization result) and "Save as-is" (PATCH with just content + `editedAt`).

"Re-process with AI" flow:
1. PATCH `{ content: newContent }` → updates content
2. POST `/api/categorize` with `{ content: newContent }` → get new categories/tags/insight
3. PATCH `{ categories, tags, summary, insight, readingTime }` → updates AI fields
4. Call `onSave(updatedEntry)`

- [ ] **Step 4: Create `src/components/entries/RelatedEntries.tsx`**

Fetch `/api/entries?tag=tag1&tag=tag2&limit=3`. Filter out `currentId`. Render 2-3 compact cards. If no results, render nothing (no empty state).

- [ ] **Step 5: Wire modal into `src/app/page.tsx`**

Replace the `// Task 6 slot` comment with `{openEntryId && <EntryDetailModal entryId={openEntryId} onClose={() => setOpenEntryId(null)} onDeleted={handleDeleted} onTagFilter={handleTagFilter} />}`.

- [ ] **Step 6: Verify build + browser test**

Click a card → modal opens with full content.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Modal.tsx src/components/entries/EntryDetailModal.tsx src/components/entries/EntryEditForm.tsx src/components/entries/RelatedEntries.tsx src/app/page.tsx
git commit -m "feat: entry detail modal with edit, related entries, source card"
```

---

## Task 7: AI Chat Interface

**Files:**
- Create: `src/app/api/chat/route.ts`
- Create: `src/components/chat/ChatMessage.tsx`
- Create: `src/components/chat/CitationPills.tsx`
- Create: `src/components/chat/ChatInterface.tsx`
- Modify: `src/app/chat/page.tsx` (replace stub with real chat)

**Interfaces:**
- Produces:
  - `POST /api/chat` body: `{ question: string; history: Array<{role:'user'|'assistant';content:string}> }` → streaming text response with citation markers `[1]`, `[2]` etc. + final JSON line `{"citations":[{id,title}]}`
  - `<ChatInterface>` — renders messages list + input; manages localStorage history
  - `<ChatMessage message: ChatMessage>` — renders user or assistant message with markdown
  - `<CitationPills citations: Array<{id:string;title:string}>; onOpen: (id:string)=>void>`

- [ ] **Step 1: Create `src/app/api/chat/route.ts`** — RAG + streaming

```ts
export async function POST(req: Request) {
  // 1. auth + connectDB
  // 2. Parse { question, history }
  // 3. Search entries: EntryModel.find({ userId, $text: { $search: question } })
  //    .select('title insight summary tags categories url')
  //    .limit(8).lean()
  //    Also fallback: if $text returns <3 results, do keyword-based:
  //    extract nouns from question (split by spaces, filter >3 chars), query tags
  // 4. If no entries found: return stream with "I don't have information about that in your brain yet. Try saving some notes first!"
  //    (addresses Review Focus #1)
  // 5. Build context string from entries (title + insight + summary truncated to 500 chars each)
  // 6. Call model.generateContentStream() with system prompt:
  //    "You are answering questions from a personal knowledge base. Answer ONLY from the provided context.
  //     Cite sources as [1], [2] etc. matching the entry index. If context is insufficient, say so honestly."
  // 7. Stream response via ReadableStream + TransformStream
  // 8. After stream ends, append a final newline + JSON: {"citations":[{id,title}]}
}
```

**Streaming implementation:**

```ts
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    try {
      const result = await model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      // append citations as final JSON line
      controller.enqueue(encoder.encode('\n' + JSON.stringify({ citations })));
    } catch {
      controller.enqueue(encoder.encode('\n[Stream error]'));
    } finally {
      controller.close(); // addresses Review Focus #2
    }
  }
});
return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

- [ ] **Step 2: Create `src/components/chat/CitationPills.tsx`**

Renders citation pills with entry title, clickable → opens Entry Detail Modal. Small, muted style with violet border.

- [ ] **Step 3: Create `src/components/chat/ChatMessage.tsx`**

User message: right-aligned, `var(--accent)` bg, white text, rounded.
Assistant message: left-aligned, `var(--surface-raised)` bg, markdown rendered with `<ReactMarkdown remarkPlugins={[remarkGfm]}>`. Shows `<CitationPills>` if citations present.

Streaming: if `message.streaming === true`, show blinking cursor after last word.

- [ ] **Step 4: Create `src/components/chat/ChatInterface.tsx`**

State: `messages: ChatMessage[]` loaded from `localStorage.getItem('braindump-chat')` on mount; `openEntryId` for citation modal.

Send flow:
1. Append user message to state + localStorage
2. Append empty assistant message with `streaming: true`
3. `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ question, history: last10 }) })`
4. Read `response.body` as `ReadableStream`, decode with `TextDecoder`
5. Buffer incoming text. Last line starting with `{"citations"` is parsed as JSON; everything else appended to assistant message content
6. On stream end: set `streaming: false`, parse citations, update message

Clear chat button: `localStorage.removeItem('braindump-chat')`, reset state.

- [ ] **Step 5: Replace stub in `src/app/chat/page.tsx`**

```tsx
'use client';
// Render: <AppShell sidebar={<Sidebar activeTab="chat" .../>}><ChatInterface/></AppShell>
// Sidebar data (categories/tags) fetched with useInfiniteEntries or separate /api/settings call
```

- [ ] **Step 6: Verify build + manual test**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```
Test: Open /chat, ask "what do I know about React?", verify streamed response with citations.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/chat/ src/components/chat/ src/app/chat/page.tsx
git commit -m "feat: AI chat with streaming RAG and citations"
```

---

## Task 8: Command Palette

**Files:**
- Create: `src/components/search/CommandPalette.tsx`
- Create: `src/hooks/useCommandPalette.ts`
- Modify: `src/app/layout.tsx` (add `<CommandPalette>` + ⌘K handler)

**Interfaces:**
- Produces:
  - `useCommandPalette()` → `{ open: boolean; setOpen: (v:boolean)=>void }`
  - `<CommandPalette open: boolean; onClose: ()=>void; onOpenEntry: (id:string)=>void>`

- [ ] **Step 1: Create `src/hooks/useCommandPalette.ts`**

`useState(false)` with `useEffect` that registers `keydown` listener for `(e.metaKey || e.ctrlKey) && e.key === 'k'` → `e.preventDefault(); setOpen(true)`. Returns `{ open, setOpen }`.

- [ ] **Step 2: Create `src/components/search/CommandPalette.tsx`**

Uses `cmdk` `<Command>` component. Style: `<Modal>` wrapper (narrow, 480px max-w). Content:
- `<Command.Input>` with placeholder "Search or jump to…"
- `<Command.Group heading="Entries">` — search entries via `GET /api/entries?search=query&limit=5`; debounced. Each item shows title + category + date
- `<Command.Group heading="Quick Actions">`: "New entry" (focus DumpBox), "Open Chat" (navigate to /chat), "Settings" (navigate to /settings), "Toggle theme" (calls useTheme)
- `<Command.Empty>` → "No results"

Keyboard: `↑↓` navigate, `Enter` selects, `Escape` closes.

- [ ] **Step 3: Wire into `src/app/layout.tsx`**

Add `<CommandPalette>` inside the layout, controlled by a context or prop-drilled `useCommandPalette()` hook. The `N` shortcut in DumpBox and `⌘K` both funnel through `useCommandPalette`.

Since layout.tsx is a Server Component, extract a `ClientShell.tsx` wrapper that holds client-side state.

- [ ] **Step 4: Verify build + test**

Press ⌘K, verify palette opens. Type a query, verify entry search works.

- [ ] **Step 5: Commit**

```bash
git add src/components/search/CommandPalette.tsx src/hooks/useCommandPalette.ts src/app/layout.tsx
git commit -m "feat: command palette (⌘K) with entry search and quick actions"
```

---

## Task 9: Settings Redesign + Tag Management

**Files:**
- Create: `src/components/settings/SettingsShell.tsx`
- Create: `src/components/settings/AITab.tsx`
- Create: `src/components/settings/CategoriesTab.tsx`
- Create: `src/components/settings/TagsTab.tsx`
- Create: `src/components/settings/AppearanceTab.tsx`
- Create: `src/components/settings/AccountTab.tsx`
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `GET/POST /api/settings`, `GET /api/tags`, `PATCH /api/tags/[tag]`, `DELETE /api/tags/[tag]`, `GET /api/export`
- Produces: `<SettingsShell>` with 5 tabs; each tab self-contained

- [ ] **Step 1: Create `src/components/settings/SettingsShell.tsx`**

Uses `@radix-ui/react-tabs`. Tab list: "AI & Providers" | "Categories" | "Tags" | "Appearance" | "Account".

- [ ] **Step 2: Create `src/components/settings/AITab.tsx`**

Migrates all logic from existing `SettingsForm.tsx` (Gemini key + max tokens). Fetches/saves via `/api/settings`.

- [ ] **Step 3: Create `src/components/settings/CategoriesTab.tsx`**

Migrates category management from existing `SettingsForm.tsx`. Shows user categories with add/delete. No reorder (design doc builder decision).

- [ ] **Step 4: Create `src/components/settings/TagsTab.tsx`**

Fetches `GET /api/tags`. Displays list with count. Each tag row: name, count, edit icon (inline rename via `PATCH /api/tags/[tag]`), delete icon (with confirm → `DELETE /api/tags/[tag]`).

Merge feature: "Merge into…" dropdown that lists other tags; selecting one calls `PATCH /api/tags/[sourceTag]` with `{ newName: targetTag }` which effectively merges by renaming all source instances.

- [ ] **Step 5: Create `src/components/settings/AppearanceTab.tsx`**

Controls: Theme toggle (Dark/Light/System), Default view (Card/List) — stored in `localStorage`. Compact mode toggle (stored in `localStorage`, affects DumpBox and card padding via CSS class on `<html>`).

- [ ] **Step 6: Create `src/components/settings/AccountTab.tsx`**

Shows Clerk user email/name. "Export all entries" button → calls `GET /api/export` and triggers browser download via `<a href={url} download>`. Danger zone: "Delete all entries" (confirm dialog → `DELETE /api/entries` endpoint — create this if not already present).

- [ ] **Step 7: Update `src/app/settings/page.tsx`**

Replace `<SettingsForm>` with `<SettingsShell>`.

- [ ] **Step 8: Verify build**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

- [ ] **Step 9: Commit**

```bash
git add src/components/settings/ src/app/settings/page.tsx
git commit -m "feat: settings redesign with tabs, tag management, export"
```

---

## Task 10: Polish Pass — Animations, Errors, Mobile

**Files:**
- Modify: `src/components/entries/EntryCard.tsx` — animate delete (scale+fade)
- Modify: `src/components/entries/EntryGrid.tsx` — stagger timing tuning
- Modify: `src/app/page.tsx` — page transition, empty states
- Modify: `src/app/chat/page.tsx` — chat message entrance animation
- Create: `src/components/ui/EmptyState.tsx`
- Modify: `src/app/globals.css` — mobile breakpoints, scrollbar styling

**Interfaces:**
- Consumes: all previous tasks
- Produces: polished, mobile-responsive app

- [ ] **Step 1: Create `src/components/ui/EmptyState.tsx`**

Generic empty state: icon (Brain from lucide), title, subtitle, optional CTA button. Used in browse (no entries), search (no results), chat (no history), tags (no tags).

- [ ] **Step 2: Tune entry card delete animation**

Entry delete: `exit={{ opacity: 0, scale: 0.9, height: 0 }}` + `AnimatePresence`. Grid items reflow smoothly via Framer Motion `layout`.

- [ ] **Step 3: Add page-level transitions**

Wrap each page's main content in `<motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>`.

- [ ] **Step 4: Chat message entrance animation**

Each `<ChatMessage>` mounts with `initial={{ opacity:0, x: role==='user' ? 20 : -20 }}` → `animate={{ opacity:1, x:0 }}`.

- [ ] **Step 5: Mobile responsiveness**

Sidebar: on mobile (`< 768px`), sidebar is an overlay (position fixed, slide in from left) triggered by menu button. DumpBox: full width. Cards: single column on mobile. Command palette: full width on mobile.

Add to `src/app/globals.css`:
```css
@media (max-width: 768px) {
  :root { --sidebar-width: 100vw; }
  .sidebar-overlay { position: fixed; inset: 0; z-index: 40; }
}
```

- [ ] **Step 6: Custom scrollbar styling**

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
```

- [ ] **Step 7: Final build + deploy**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -10
npm run deploy 2>&1 | tail -5
```
Expected: Clean build + deployed to CF Workers.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: polish pass — animations, mobile, empty states, scrollbar"
```

---

## Self-Review

**Spec coverage:**
- ✅ Smart capture (Task 5 DumpBox)
- ✅ AI pipeline enhancements (Task 3)
- ✅ AI Chat with RAG (Task 7)
- ✅ Browse mode — card/list, filter, infinite scroll (Task 5)
- ✅ Tag cloud in sidebar (Task 4)
- ✅ Entry detail modal (Task 6)
- ✅ Command palette ⌘K (Task 8)
- ✅ Tag management (Task 9)
- ✅ Enhanced settings (Task 9)
- ✅ Export (Task 9)
- ✅ Animations + mobile (Task 10)
- ✅ Design tokens (Task 1)

**Review Focus addressed:**
1. Empty knowledge base chat → Task 7 handles with graceful message
2. Streaming leak → `finally { controller.close() }` in Task 7
3. Tag rename race → documented as known (MongoDB updateMany not atomic), last-write-wins is acceptable for tag renames
4. Entry modal with missing fields → Task 6 uses `?? ''` fallbacks on all optional fields
5. Infinite scroll at boundary → Task 5 guards `hasMore` before calling `loadMore`

**Type consistency:** All interfaces use `Entry` from `src/types/index.ts`. `ChatMessage` defined in Task 2 Step 2, used in Task 7.
