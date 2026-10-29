'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag as TagIcon } from 'lucide-react';
import type { Tag } from '@/types';

interface TagCloudProps {
  tags: Tag[];
  selected: string;
  onSelect: (name: string) => void;
  maxVisible?: number;
}

export default function TagCloud({ tags, selected, onSelect, maxVisible = 20 }: TagCloudProps) {
  const [showAll, setShowAll] = useState(false);

  if (tags.length === 0) return null;

  const visible = showAll ? tags : tags.slice(0, maxVisible);
  const hasMore = tags.length > maxVisible;

  return (
    <div className="space-y-2">
      <motion.div layout className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {visible.map((tag) => (
            <motion.button
              key={tag.name}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSelect(selected === tag.name ? '' : tag.name)}
              className="group flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-all duration-150"
              style={
                selected === tag.name
                  ? {
                      background: 'var(--accent)',
                      color: '#fff',
                    }
                  : {
                      background: 'var(--accent-dim)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent-border)',
                    }
              }
            >
              <TagIcon className="w-2.5 h-2.5 opacity-70" />
              <span>{tag.name}</span>
              <span className="opacity-60 text-[10px]">{tag.count}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {showAll ? 'Show less' : `+${tags.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}
