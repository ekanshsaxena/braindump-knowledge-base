'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Brain, Layers, MessageSquare, Archive, Pin } from 'lucide-react';
import TagCloud from './TagCloud';
import type { Category, Tag } from '@/types';

interface SidebarProps {
  activeTab: 'browse' | 'chat';
  categories: Category[];
  tags: Tag[];
  selectedCategory: string;
  selectedTag: string;
  onCategorySelect: (name: string) => void;
  onTagSelect: (name: string) => void;
  entryCount: number;
  pinnedCount?: number;
  open: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeTab,
  categories,
  tags,
  selectedCategory,
  selectedTag,
  onCategorySelect,
  onTagSelect,
  entryCount,
  pinnedCount = 0,
  open,
}: SidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 h-screen sticky top-0 overflow-hidden flex flex-col"
          style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div className="w-[240px] flex flex-col h-full overflow-y-auto">
            {/* Logo */}
            <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  BrainDump
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {entryCount} entries
                </p>
              </div>
            </div>

            {/* Nav tabs */}
            <div className="px-3 pb-4">
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'var(--surface-raised)' }}
              >
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={
                    activeTab === 'browse'
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Layers className="w-3 h-3" />
                  Browse
                </Link>
                <Link
                  href="/chat"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={
                    activeTab === 'chat'
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </Link>
              </div>
            </div>

            <div className="flex-1 px-3 space-y-5 overflow-y-auto pb-4">
              {/* Pinned shortcut */}
              {pinnedCount > 0 && (
                <div>
                  <button
                    onClick={() => onCategorySelect('__pinned__')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-150"
                    style={
                      selectedCategory === '__pinned__'
                        ? { background: 'var(--accent-dim)', color: 'var(--accent-text)' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                    <span
                      className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}
                    >
                      {pinnedCount}
                    </span>
                  </button>
                </div>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Categories
                  </p>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => onCategorySelect('all')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-150"
                      style={
                        selectedCategory === 'all' || !selectedCategory
                          ? { background: 'var(--accent-dim)', color: 'var(--accent-text)' }
                          : { color: 'var(--text-secondary)' }
                      }
                    >
                      <span>📚</span>
                      <span>All entries</span>
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                      >
                        {entryCount}
                      </span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => onCategorySelect(cat.name)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-150"
                        style={
                          selectedCategory === cat.name
                            ? { background: 'var(--accent-dim)', color: 'var(--accent-text)' }
                            : { color: 'var(--text-secondary)' }
                        }
                      >
                        <span>{cat.emoji}</span>
                        <span className="truncate flex-1 text-left">{cat.name}</span>
                        <span
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                        >
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived shortcut */}
              <div>
                <button
                  onClick={() => onCategorySelect('__archived__')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-150"
                  style={
                    selectedCategory === '__archived__'
                      ? { background: 'var(--accent-dim)', color: 'var(--accent-text)' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  <Archive className="w-3 h-3" />
                  <span>Archived</span>
                </button>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Tags
                  </p>
                  <TagCloud
                    tags={tags}
                    selected={selectedTag}
                    onSelect={onTagSelect}
                    maxVisible={20}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
