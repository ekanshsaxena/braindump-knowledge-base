'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Archive, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Entry } from '@/types';

interface EntryCardProps {
  entry: Entry;
  onOpen: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function EntryCard({ entry, onOpen, onPin, onArchive, onDelete }: EntryCardProps) {
  const [hovered, setHovered] = useState(false);

  const cats = entry.categories?.slice(0, 2) ?? [];
  const extraCats = (entry.categories?.length ?? 0) - 2;
  const tags = entry.tags?.slice(0, 3) ?? [];
  const extraTags = (entry.tags?.length ?? 0) - 3;

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
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative cursor-pointer rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
      onClick={() => onOpen(entry._id)}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Categories */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cats.map((cat) => (
              <span
                key={cat.name}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </span>
            ))}
            {extraCats > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px]"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                +{extraCats}
              </span>
            )}
            {entry.pinned && (
              <span className="ml-auto">
                <Pin className="w-3 h-3" style={{ color: 'var(--accent-text)' }} />
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {entry.title || entry.content.slice(0, 80)}
        </h3>

        {/* Insight */}
        {entry.insight && (
          <p className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
            {entry.insight}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                #{tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                +{extraTags}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            {domain && (
              <>
                <ExternalLink className="w-3 h-3" />
                <span className="text-[10px]">{domain}</span>
                <span className="text-[10px]">·</span>
              </>
            )}
            {entry.readingTime && entry.readingTime > 0 && (
              <>
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">{entry.readingTime}m</span>
                <span className="text-[10px]">·</span>
              </>
            )}
            <span className="text-[10px]">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute top-3 right-3 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {onPin && (
          <button
            onClick={() => onPin(entry._id, !entry.pinned)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--surface-raised)', color: entry.pinned ? 'var(--accent-text)' : 'var(--text-muted)' }}
            title={entry.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3 h-3" />
          </button>
        )}
        {onArchive && (
          <button
            onClick={() => onArchive(entry._id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
            title="Archive"
          >
            <Archive className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(entry._id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
