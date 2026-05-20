'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ExternalLink, Tag, Clock } from 'lucide-react';
import { Entry } from '@/types';
import { toast } from './Toast';
import EntryModal from './EntryModal';

interface Props {
  entry: Entry;
  onDeleted: (id: string) => void;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EntryCard({ entry, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimer.current) {
      // Second click within 300ms → double click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setModalOpen(true);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        setExpanded((e) => !e);
      }, 260);
    }
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
      onDeleted(entry._id);
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  const isUrl = entry.type === 'url' || entry.type === 'mixed';
  // Only use URL metadata as the card heading for pure URL entries (no user text)
  const hasMetadata = entry.type === 'url' && entry.urlMetadata?.title;
  const categories = entry.categories ?? [];
  const cardTitle = entry.title || (entry.type === 'url' ? entry.urlMetadata?.title : null);
  const displayText = entry.summary || entry.content;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: deleting ? 0 : 1, y: 0, scale: deleting ? 0.95 : 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 cursor-pointer select-none"
      >
        {entry.urlMetadata?.thumbnail && (
          <div className="relative h-36 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={entry.urlMetadata.thumbnail}
              alt={entry.urlMetadata.title || ''}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = 'none')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 dark:from-zinc-900/60 to-transparent" />
          </div>
        )}

        <div className="p-4">
          {/* Categories */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {categories.slice(0, 3).map((cat) => (
                <span
                  key={cat.name}
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  <span className="text-[11px] leading-none">{cat.emoji}</span>
                  {cat.name}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  +{categories.length - 3}
                </span>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 p-1 -mr-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title */}
          {cardTitle && (
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-2">
              {cardTitle}
            </h3>
          )}

          {/* URL source line */}
          {hasMetadata && (
            <div className="flex items-center gap-1.5 mb-2">
              {entry.urlMetadata?.favicon && (
                <img src={entry.urlMetadata.favicon} alt="" className="w-3.5 h-3.5" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              )}
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{entry.urlMetadata?.siteName}</span>
            </div>
          )}

          {/* Summary / content — capped height when expanded */}
          {displayText && (
            <div
              className={`text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-hidden transition-all duration-200 ${
                expanded ? 'max-h-40 overflow-y-auto' : 'line-clamp-3'
              }`}
            >
              {displayText}
            </div>
          )}

          {/* Hint */}
          {!expanded && displayText && displayText.length > 180 && (
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">
              Click to expand · Double-click to open
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              {entry.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-600">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(entry.createdAt)}
              </span>
              {isUrl && entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 dark:text-zinc-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <EntryModal entry={modalOpen ? entry : null} onClose={() => setModalOpen(false)} />
    </>
  );
}
