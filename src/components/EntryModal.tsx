'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Clock, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Entry } from '@/types';

interface Props {
  entry: Entry | null;
  onClose: () => void;
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
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EntryModal({ entry, onClose }: Props) {
  useEffect(() => {
    if (!entry) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entry, onClose]);

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 top-12 bottom-12 z-50 max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex flex-col gap-2 min-w-0">
                {/* Categories */}
                <div className="flex flex-wrap gap-1.5">
                  {(entry.categories ?? []).map((cat) => (
                    <span key={cat.name} className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
                      <span className="text-[11px]">{cat.emoji}</span>
                      {cat.name}
                    </span>
                  ))}
                </div>
                {/* AI-generated title, or URL title for pure URL entries */}
                {(entry.title || (entry.type === 'url' && entry.urlMetadata?.title)) && (
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {entry.title || entry.urlMetadata?.title}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL thumbnail */}
            {entry.urlMetadata?.thumbnail && (
              <div className="shrink-0 h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={entry.urlMetadata.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = 'none')}
                />
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Summary — structured markdown */}
              {entry.summary && (
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:text-zinc-800 dark:prose-headings:text-zinc-100
                  prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
                  prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
                  prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-p:leading-relaxed
                  prose-li:text-zinc-600 dark:prose-li:text-zinc-300
                  prose-strong:text-zinc-800 dark:prose-strong:text-zinc-100
                  prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:break-all
                  prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                  <ReactMarkdown>{entry.summary}</ReactMarkdown>
                </div>
              )}

              {/* Tags — all of them */}
              {entry.tags?.length > 0 && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-0.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        <Tag className="w-2.5 h-2.5 shrink-0" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-600">
                {entry.urlMetadata?.favicon && (
                  <img src={entry.urlMetadata.favicon} alt="" className="w-3.5 h-3.5 mr-1" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                )}
                {entry.urlMetadata?.siteName && <span className="mr-2">{entry.urlMetadata.siteName}</span>}
                <Clock className="w-3 h-3" />
                <span>{timeAgo(entry.createdAt)}</span>
              </div>
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open original
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
