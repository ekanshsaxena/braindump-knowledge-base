'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Edit2, Pin, Archive, Trash2, Copy, ExternalLink,
  Clock, Calendar, Tag, Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import EntryEditForm from './EntryEditForm';
import RelatedEntries from './RelatedEntries';
import type { Entry } from '@/types';

interface EntryDetailModalProps {
  entryId: string | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onTagFilter: (tag: string) => void;
}

export default function EntryDetailModal({ entryId, onClose, onDeleted, onTagFilter }: EntryDetailModalProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [openRelatedId, setOpenRelatedId] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    setLoading(true);
    setEditing(false);
    setEntry(null);
    fetch(`/api/entries/${entryId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setEntry(data))
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [entryId]);

  async function handlePin() {
    if (!entry) return;
    const res = await fetch(`/api/entries/${entry._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !entry.pinned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntry(updated);
      toast.success(updated.pinned ? 'Pinned!' : 'Unpinned');
    }
  }

  async function handleArchive() {
    if (!entry) return;
    await fetch(`/api/entries/${entry._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    toast.success('Archived');
    onClose();
  }

  async function handleDelete() {
    if (!entry) return;
    await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
    onDeleted(entry._id);
  }

  function handleCopyMarkdown() {
    if (!entry) return;
    const md = `# ${entry.title ?? ''}\n\n${entry.summary ?? entry.content}`;
    navigator.clipboard.writeText(md);
    toast.success('Copied to clipboard!');
  }

  const domain = entry?.url
    ? (() => { try { return new URL(entry.url).hostname.replace('www.', ''); } catch { return ''; } })()
    : '';

  // Handle viewing a related entry
  useEffect(() => {
    if (!openRelatedId) return;
    setLoading(true);
    setEditing(false);
    fetch(`/api/entries/${openRelatedId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setEntry(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    setOpenRelatedId(null);
  }, [openRelatedId]);

  return (
    <Modal open={!!entryId} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : !entry ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Entry not found
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-7 space-y-6"
        >
          {/* Categories */}
          {(entry.categories?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.categories.map((cat) => (
                <span
                  key={cat.name}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {entry.title || 'Untitled'}
          </h2>

          {/* Insight callout */}
          {entry.insight && (
            <div
              className="px-4 py-3 rounded-xl text-sm leading-relaxed"
              style={{
                background: 'var(--accent-dim)',
                borderLeft: '3px solid var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              {entry.insight}
            </div>
          )}

          {/* Edit form or markdown content */}
          {editing ? (
            <EntryEditForm
              entry={entry}
              onSave={(updated) => { setEntry(updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div
              className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {entry.summary || entry.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Source URL card */}
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 group"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              {entry.urlMetadata?.favicon && (
                <img
                  src={entry.urlMetadata.favicon}
                  alt=""
                  className="w-5 h-5 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {entry.urlMetadata?.title ?? domain}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{domain}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:opacity-100 opacity-50 transition-opacity" style={{ color: 'var(--text-muted)' }} />
            </a>
          )}

          {/* Tags */}
          {(entry.tags?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { onTagFilter(tag); onClose(); }}
                    className="px-2 py-1 rounded-lg text-xs transition-colors"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3 h-3" />
              {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, yyyy') : ''}
            </div>
            {entry.editedAt && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Edit2 className="w-3 h-3" />
                Edited {formatDistanceToNow(new Date(entry.editedAt), { addSuffix: true })}
              </div>
            )}
            {(entry.readingTime ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" />
                {entry.readingTime}m read
              </div>
            )}
          </div>

          {/* Related entries */}
          {(entry.tags?.length ?? 0) > 0 && (
            <RelatedEntries
              currentId={entry._id}
              tags={entry.tags}
              onOpen={(id) => setOpenRelatedId(id)}
            />
          )}

          {/* Action bar */}
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={handlePin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: entry.pinned ? 'var(--accent-dim)' : 'var(--surface-raised)', color: entry.pinned ? 'var(--accent-text)' : 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <Pin className="w-3 h-3" />
              {entry.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
              style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}
