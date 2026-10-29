'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Entry } from '@/types';

interface RelatedEntriesProps {
  currentId: string;
  tags: string[];
  onOpen: (id: string) => void;
}

export default function RelatedEntries({ currentId, tags, onOpen }: RelatedEntriesProps) {
  const [related, setRelated] = useState<Entry[]>([]);

  useEffect(() => {
    if (tags.length === 0) return;
    const tag = tags[0];
    fetch(`/api/entries?tag=${encodeURIComponent(tag)}&limit=5`)
      .then((r) => r.ok ? r.json() : { entries: [] })
      .then((d) => {
        const filtered = (d.entries ?? []).filter((e: Entry) => e._id !== currentId).slice(0, 3);
        setRelated(filtered);
      })
      .catch(() => {});
  }, [currentId, tags]);

  if (related.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Related
      </p>
      <div className="space-y-2">
        {related.map((entry) => {
          const timeAgo = (() => {
            try { return formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }); }
            catch { return ''; }
          })();

          return (
            <button
              key={entry._id}
              onClick={() => onOpen(entry._id)}
              className="w-full text-left p-3 rounded-xl transition-all duration-150"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {entry.title || entry.content.slice(0, 60)}
              </p>
              {entry.insight && (
                <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {entry.insight}
                </p>
              )}
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
