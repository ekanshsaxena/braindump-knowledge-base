'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, Brain, Menu, X, RefreshCw, Sun, Moon } from 'lucide-react';
import DumpBox from '@/components/DumpBox';
import EntryCard from '@/components/EntryCard';
import CategorySidebar from '@/components/CategorySidebar';
import SearchBar from '@/components/SearchBar';
import { Entry, Category } from '@/types';

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  return { theme, toggle };
}

export default function Home() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggle: toggleTheme } = useTheme();
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (!data.onboardingCompleted) {
          router.push('/onboarding');
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [search]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetch(`/api/entries?${params}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('Entries fetch failed:', res.status, data?.error);
        return;
      }
      setEntries(data.entries || []);
      setCategories(data.categories || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Entries fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleEntryAdded = () => {
    fetchEntries();
    setSelectedCategory('all');
    setSearch('');
  };

  const handleEntryDeleted = (id: string) => {
    setEntries((prev) => prev.filter((e) => e._id !== id));
    setTotal((prev) => prev - 1);
    setTimeout(fetchEntries, 300);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/60 transition-colors duration-200">
        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm hidden sm:block">BrainDump</span>
          </Link>

          <div className="flex-1 max-w-md">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={fetchEntries}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:block">Settings</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 transition-colors duration-200"
            >
              <div className="w-[220px] pt-6 px-3 pb-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
                <CategorySidebar
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                  totalCount={total}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6">
          <DumpBox onEntryAdded={handleEntryAdded} />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {debouncedSearch
                ? `Results for "${debouncedSearch}"`
                : selectedCategory !== 'all'
                ? `${categories.find((c) => c.name === selectedCategory)?.emoji ?? ''} ${selectedCategory}`
                : 'All entries'}
              {!loading && (
                <span className="text-zinc-400 dark:text-zinc-600 ml-1.5">({total})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800">
                <Brain className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                {debouncedSearch ? 'No entries match your search' : 'Nothing here yet'}
              </p>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm">
                {debouncedSearch ? 'Try different keywords' : 'Start dumping your thoughts above'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {entries.map((entry, i) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <EntryCard entry={entry} onDeleted={handleEntryDeleted} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
