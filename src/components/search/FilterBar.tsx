'use client';

import { LayoutGrid, List, X, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FilterState } from '@/types';

interface FilterBarProps {
  view: 'card' | 'list';
  onViewChange: (v: 'card' | 'list') => void;
  filters: FilterState;
  onClearFilter: (key: keyof FilterState) => void;
  onSortChange: (s: 'newest' | 'oldest') => void;
}

const sortLabels: Record<string, string> = { newest: 'Newest first', oldest: 'Oldest first' };

export default function FilterBar({ view, onViewChange, filters, onClearFilter, onSortChange }: FilterBarProps) {
  const activeFilters: Array<{ key: keyof FilterState; label: string }> = [];

  if (filters.search) activeFilters.push({ key: 'search', label: `"${filters.search.slice(0, 20)}"` });
  if (filters.category && filters.category !== 'all') {
    const label = filters.category === '__pinned__' ? '📌 Pinned'
      : filters.category === '__archived__' ? '🗃️ Archived'
      : filters.category;
    activeFilters.push({ key: 'category', label });
  }
  if (filters.tag) activeFilters.push({ key: 'tag', label: `#${filters.tag}` });
  if (filters.type) activeFilters.push({ key: 'type', label: filters.type });

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* View toggle */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-xl"
        style={{ background: 'var(--surface)' }}
      >
        <button
          onClick={() => onViewChange('card')}
          className="p-1.5 rounded-lg transition-all duration-150"
          style={view === 'card'
            ? { background: 'var(--accent)', color: '#fff' }
            : { color: 'var(--text-muted)' }
          }
          title="Card view"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onViewChange('list')}
          className="p-1.5 rounded-lg transition-all duration-150"
          style={view === 'list'
            ? { background: 'var(--accent)', color: '#fff' }
            : { color: 'var(--text-muted)' }
          }
          title="List view"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={filters.sort ?? 'newest'}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
          className="flex items-center gap-1.5 pl-7 pr-3 py-1.5 rounded-xl text-xs cursor-pointer appearance-none"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <SortAsc
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilters.map(({ key, label }) => (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent-text)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <span>{label}</span>
            <button onClick={() => onClearFilter(key)} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeFilters.length > 1 && (
        <button
          onClick={() => {
            onClearFilter('search');
            onClearFilter('category');
            onClearFilter('tag');
            onClearFilter('type');
          }}
          className="text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export { sortLabels };
