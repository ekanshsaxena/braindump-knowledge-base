'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Layers, MessageSquare, Settings as SettingsIcon, Sun, Moon, Loader2 } from 'lucide-react';
import type { Entry } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenEntry: (id: string) => void;
  theme?: string;
  onToggleTheme?: () => void;
}

export default function CommandPalette({ open, onClose, onOpenEntry, theme, onToggleTheme }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);
  const [searching, setSearching] = useState(false);

  const searchEntries = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/entries?search=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.entries ?? []);
      }
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchEntries(query), 250);
    return () => clearTimeout(timer);
  }, [query, searchEntries]);

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); }
  }, [open]);

  function handleSelect(action: () => void) {
    onClose();
    action();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-1/4 left-1/2 z-50 w-full max-w-xl px-4"
            style={{ transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Command
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
              shouldFilter={false}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                )}
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search entries or type a command…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder-[var(--text-muted)]"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                >
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                {/* Entry results */}
                {results.length > 0 && (
                  <Command.Group
                    heading="Entries"
                    className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {results.map((entry) => (
                      <Command.Item
                        key={entry._id}
                        onSelect={() => handleSelect(() => onOpenEntry(entry._id))}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <span className="text-sm">{entry.categories?.[0]?.emoji ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{entry.title || entry.content.slice(0, 60)}</p>
                          {entry.insight && (
                            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{entry.insight}</p>
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Quick actions */}
                <Command.Group
                  heading="Quick Actions"
                  className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Command.Item
                    onSelect={() => handleSelect(() => router.push('/'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Layers className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                    <span className="text-sm">Browse entries</span>
                    <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>⌘1</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect(() => router.push('/chat'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                    <span className="text-sm">Open Chat</span>
                    <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>⌘2</kbd>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect(() => router.push('/settings'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <SettingsIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm">Settings</span>
                    <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>,</kbd>
                  </Command.Item>
                  {onToggleTheme && (
                    <Command.Item
                      onSelect={() => handleSelect(() => onToggleTheme())}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                      <span className="text-sm">Toggle theme</span>
                    </Command.Item>
                  )}
                </Command.Group>

                <Command.Empty className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No results found
                </Command.Empty>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
