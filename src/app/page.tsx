'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Settings, Search, Sun, Moon, RefreshCw, Pin, X } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import DumpBox from '@/components/capture/DumpBox';
import EntryGrid from '@/components/entries/EntryGrid';
import FilterBar from '@/components/search/FilterBar';
import { useInfiniteEntries } from '@/hooks/useInfiniteEntries';
import { useTheme } from '@/hooks/useTheme';
import type { FilterState, Entry } from '@/types';

import EntryDetailModal from '@/components/entries/EntryDetailModal';

export default function Home() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [filters, setFilters] = useState<FilterState>({ sort: 'newest' });

  // Check onboarding
  useEffect(() => {
    if (sessionStorage.getItem('onboardingCompleted')) return;
    fetch('/api/settings')
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => { if (data && !data.onboardingCompleted) router.push('/onboarding'); })
      .catch(() => {});
  }, [router]);

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem('braindump-view') as 'card' | 'list' | null;
    if (savedView) setView(savedView);
  }, []);

  const activeFilters: FilterState = {
    ...filters,
    search: searchValue,
  };

  const { entries, categories, tags, total, loading, hasMore, loadMore, refresh } =
    useInfiniteEntries(activeFilters);

  const pinnedCount = entries.filter((e) => e.pinned).length;

  const handleClearFilter = useCallback((key: keyof FilterState) => {
    if (key === 'search') {
      setSearchValue('');
    } else {
      setFilters((prev) => ({ ...prev, [key]: undefined }));
    }
  }, []);

  const handlePin = useCallback(async (id: string, pinned: boolean) => {
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    });
    refresh();
  }, [refresh]);

  const handleArchive = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    refresh();
  }, [refresh]);

  const handleViewChange = (v: 'card' | 'list') => {
    setView(v);
    localStorage.setItem('braindump-view', v);
  };

  const pinnedEntries = entries.filter((e: Entry) => e.pinned);
  const unpinnedEntries = entries.filter((e: Entry) => !e.pinned);

  const sidebar = (
    <Sidebar
      activeTab="browse"
      categories={categories}
      tags={tags}
      selectedCategory={filters.category ?? 'all'}
      selectedTag={filters.tag ?? ''}
      onCategorySelect={(name) => setFilters((prev) => ({ ...prev, category: name, tag: undefined }))}
      onTagSelect={(name) => setFilters((prev) => ({ ...prev, tag: name === prev.tag ? undefined : name }))}
      entryCount={total}
      pinnedCount={pinnedCount}
      open={sidebarOpen}
    />
  );

  return (
    <AppShell sidebar={sidebar}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 h-14 shrink-0"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search entries…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-transparent outline-none placeholder-[var(--text-muted)]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/settings"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 px-5 py-5 space-y-5 overflow-y-auto"
      >
        <DumpBox onEntryAdded={refresh} />

        <FilterBar
          view={view}
          onViewChange={handleViewChange}
          filters={activeFilters}
          onClearFilter={handleClearFilter}
          onSortChange={(s) => setFilters((prev) => ({ ...prev, sort: s }))}
        />

        {/* Pinned section */}
        {pinnedEntries.length > 0 && !filters.category && !filters.tag && !searchValue && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Pinned
              </p>
            </div>
            <EntryGrid
              entries={pinnedEntries}
              loading={false}
              hasMore={false}
              onLoadMore={() => {}}
              view={view}
              onOpen={setOpenEntryId}
              onPin={handlePin}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Main entries */}
        <EntryGrid
          entries={filters.category === undefined && !filters.tag && !searchValue ? unpinnedEntries : entries}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          view={view}
          onOpen={setOpenEntryId}
          onPin={handlePin}
          onArchive={handleArchive}
          onDelete={handleDelete}
          label={
            searchValue ? `Results for "${searchValue}"` :
            filters.category && filters.category !== 'all' ? filters.category :
            filters.tag ? `#${filters.tag}` :
            'All entries'
          }
          total={total}
        />
      </motion.div>

      {/* Entry detail modal (Task 6 slot) */}
      {openEntryId && (
        <EntryDetailModal
          entryId={openEntryId}
          onClose={() => setOpenEntryId(null)}
          onDeleted={(id) => { handleDelete(id); setOpenEntryId(null); }}
          onTagFilter={(tag) => { setFilters((prev) => ({ ...prev, tag })); setOpenEntryId(null); }}
        />
      )}
    </AppShell>
  );
}
