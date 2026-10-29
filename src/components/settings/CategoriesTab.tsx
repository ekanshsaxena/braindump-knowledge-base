'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { toast } from '@/components/Toast';
import type { UserCategory } from '@/types';

export default function CategoriesTab() {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { setCategories(d.userCategories ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addCategory = () => {
    const name = newName.trim();
    if (!name || categories.some((c) => c.name === name)) { setNewName(''); setNewEmoji(''); return; }
    setCategories((prev) => [...prev, { name, emoji: newEmoji || '📌' }]);
    setNewName(''); setNewEmoji('');
  };

  const removeCategory = (name: string) => setCategories((prev) => prev.filter((c) => c.name !== name));

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCategories: categories }),
      });
      toast.success('Categories saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Your Interest Categories</p>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI maps every new entry to all matching categories from this list.</p>

      <div className="flex gap-2">
        <input type="text" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="😀" maxLength={2}
          className="w-12 rounded-xl px-3 py-2.5 text-center text-lg outline-none"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="e.g. Side Projects"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <button onClick={addCategory} disabled={!newName.trim()}
          className="px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
              {cat.emoji} {cat.name}
              <button onClick={() => removeCategory(cat.name)} className="hover:opacity-70 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No categories yet. Add some above to guide the AI.</p>
      )}

      <button onClick={handleSave} disabled={saving}
        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        {saving ? 'Saving…' : 'Save Categories'}
      </button>
    </div>
  );
}
