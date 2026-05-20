'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onChange]);

  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search entries..."
        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-violet-400/60 dark:focus:border-violet-500/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none transition-all duration-200 focus:shadow-lg focus:shadow-violet-500/10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {!value && (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 dark:text-zinc-600 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 font-mono">
          ⌘K
        </kbd>
      )}
    </div>
  );
}
