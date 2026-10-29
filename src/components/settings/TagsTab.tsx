'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit2, Check, X, Loader2, Tag as TagIcon } from 'lucide-react';
import { toast } from '@/components/Toast';
import type { Tag } from '@/types';

export default function TagsTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleRename(oldName: string) {
    const newName = editValue.trim();
    if (!newName || newName === oldName) { setEditingTag(null); return; }
    setProcessing(oldName);
    try {
      await fetch(`/api/tags/${encodeURIComponent(oldName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });
      toast.success(`Renamed to "${newName}"`);
      await fetchTags();
    } catch { toast.error('Failed to rename'); }
    finally { setProcessing(null); setEditingTag(null); }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete tag "#${name}" from all entries?`)) return;
    setProcessing(name);
    try {
      await fetch(`/api/tags/${encodeURIComponent(name)}`, { method: 'DELETE' });
      toast.success(`Deleted "#${name}"`);
      setTags((prev) => prev.filter((t) => t.name !== name));
    } catch { toast.error('Failed to delete'); }
    finally { setProcessing(null); }
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  if (tags.length === 0) return (
    <div className="flex flex-col items-center py-12">
      <TagIcon className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags yet — they appear when you save entries with AI categorization.</p>
    </div>
  );

  return (
    <div className="space-y-2 max-w-lg">
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        {tags.length} tags · Click to rename or delete
      </p>
      {tags.map((tag) => (
        <div key={tag.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--accent-text)' }}>#</span>

          {editingTag === tag.name ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(tag.name); if (e.key === 'Escape') setEditingTag(null); }}
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          ) : (
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{tag.name}</span>
          )}

          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            {tag.count}
          </span>

          {processing === tag.name ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--text-muted)' }} />
          ) : editingTag === tag.name ? (
            <>
              <button onClick={() => handleRename(tag.name)} style={{ color: 'var(--success)' }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingTag(null)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditingTag(tag.name); setEditValue(tag.name); }} style={{ color: 'var(--text-muted)' }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(tag.name)} style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
