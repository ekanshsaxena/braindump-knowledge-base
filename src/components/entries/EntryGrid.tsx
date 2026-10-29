'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import EntryCard from './EntryCard';
import EntryListItem from './EntryListItem';
import SkeletonCard from '@/components/ui/SkeletonCard';
import type { Entry } from '@/types';

interface EntryGridProps {
  entries: Entry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  view: 'card' | 'list';
  onOpen: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  label?: string;
  total?: number;
}

export default function EntryGrid({
  entries,
  loading,
  hasMore,
  onLoadMore,
  view,
  onOpen,
  onPin,
  onArchive,
  onDelete,
  label,
  total,
}: EntryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading && entries.length === 0) {
    return (
      <div className={view === 'card'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'flex flex-col gap-2'
      }>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface)' }}
        >
          <Brain className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Nothing here yet
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Start dumping your thoughts above
        </p>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          {label}
          {total !== undefined && (
            <span className="ml-1">({total})</span>
          )}
        </p>
      )}

      {view === 'card' ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {entries.map((entry, i) => (
              <motion.div
                key={entry._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
              >
                <EntryCard
                  entry={entry}
                  onOpen={onOpen}
                  onPin={onPin}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {entries.map((entry, i) => (
              <motion.div
                key={entry._id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.15 }}
              >
                <EntryListItem
                  entry={entry}
                  onOpen={onOpen}
                  onPin={onPin}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {loading && entries.length > 0 && (
        <div className="flex justify-center py-4">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </div>
  );
}
