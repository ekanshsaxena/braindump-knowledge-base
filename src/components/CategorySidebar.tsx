'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { Category } from '@/types';

interface Props {
  categories: Category[];
  selected: string;
  onSelect: (cat: string) => void;
  totalCount: number;
}

export default function CategorySidebar({ categories, selected, onSelect, totalCount }: Props) {
  return (
    <nav className="space-y-1">
      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest px-3 mb-3">
        Categories
      </p>

      <button
        onClick={() => onSelect('all')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 group ${
          selected === 'all'
            ? 'bg-violet-600 text-white'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Layers className="w-4 h-4" />
          All entries
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
          selected === 'all'
            ? 'bg-white/20'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
        }`}>
          {totalCount}
        </span>
      </button>

      <div className="space-y-0.5 mt-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(cat.name)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 group ${
              selected === cat.name
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-base leading-none shrink-0">{cat.emoji}</span>
              <span className="truncate">{cat.name}</span>
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
              selected === cat.name
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
            }`}>
              {cat.count}
            </span>
          </motion.button>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">No categories yet.</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-700 mt-1">Save your first entry!</p>
        </div>
      )}
    </nav>
  );
}
