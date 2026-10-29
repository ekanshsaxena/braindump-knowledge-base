'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Save, X } from 'lucide-react';
import { toast } from '@/components/Toast';
import type { Entry } from '@/types';

interface EntryEditFormProps {
  entry: Entry;
  onSave: (updated: Entry) => void;
  onCancel: () => void;
}

export default function EntryEditForm({ entry, onSave, onCancel }: EntryEditFormProps) {
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'reprocess' | 'asis' | null>(null);

  async function handleReprocess() {
    if (!content.trim()) return;
    setSaving(true);
    setMode('reprocess');
    try {
      // First save the content
      const patchRes = await fetch(`/api/entries/${entry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!patchRes.ok) throw new Error('Failed to save');

      // Re-categorize
      const catRes = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (catRes.ok) {
        const cat = await catRes.json();
        await fetch(`/api/entries/${entry._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: cat.categories,
            tags: cat.tags,
            summary: cat.summary,
            insight: cat.insight ?? '',
            title: cat.title ?? entry.title,
          }),
        });
      }

      const updatedRes = await fetch(`/api/entries/${entry._id}`);
      const updated = await updatedRes.json();
      toast.success('Updated and re-categorized!');
      onSave(updated);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
      setMode(null);
    }
  }

  async function handleSaveAsIs() {
    if (!content.trim()) return;
    setSaving(true);
    setMode('asis');
    try {
      const res = await fetch(`/api/entries/${entry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      toast.success('Saved!');
      onSave(updated);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
      setMode(null);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleReprocess}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {saving && mode === 'reprocess' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Re-process with AI
        </button>
        <button
          onClick={handleSaveAsIs}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          {saving && mode === 'asis' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save as-is
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors ml-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
