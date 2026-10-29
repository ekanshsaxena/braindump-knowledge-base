'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Archive, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Entry } from '@/types';

interface EntryListItemProps {
  entry: Entry;
  onOpen: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function EntryListItem({ entry, onOpen, onPin, onArchive, onDelete }: EntryListItemProps) {
  const [hovered, setHovered] = useState(false);

  const primaryCat = entry.categories?.[0];
  const tags = entry.tags?.slice(0, 4) ?? [];

  const domain = entry.url
    ? (() => { try { return new URL(entry.url).hostname.replace('www.', ''); } catch { return ''; } })()
    : '';

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }); }
    catch { return ''; }
  })();

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: hovered ? 'var(--surface-raised)' : 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onClick={() => onOpen(entry._id)}
    >
      {/* Category dot */}
      <div className="mt-1 shrink-0">
        <span className="text-base">{primaryCat?.emoji ?? '📌'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2">
          <h3
            className="text-sm font-medium leading-snug line-clamp-1 flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {entry.title || entry.content.slice(0, 80)}
          </h3>
          {entry.pinned && <Pin className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--accent-text)' }} />}
        </div>
        {entry.insight && (
          <p className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
            {entry.insight}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}
            >
              #{tag}
            </span>
          ))}
          {domain && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink className="w-2.5 h-2.5" />
              {domain}
            </span>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {onPin && (
          <button
            onClick={() => onPin(entry._id, !entry.pinned)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: entry.pinned ? 'var(--accent-text)' : 'var(--text-muted)' }}
          >
            <Pin className="w-3 h-3" />
          </button>
        )}
        {onArchive && (
          <button
            onClick={() => onArchive(entry._id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Archive className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(entry._id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
