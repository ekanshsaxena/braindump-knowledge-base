'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, Key, Hash } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function AITab() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [maxTokens, setMaxTokens] = useState(1024);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { setGeminiApiKey(d.geminiApiKey ?? ''); setMaxTokens(d.maxTokens ?? 1024); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey, maxTokens }),
      });
      toast.success('Saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div className="space-y-5 max-w-lg">
      {/* Gemini key */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'rgba(59,130,246,0.1)' }}>✨</div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Google Gemini</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>gemini-1.5-flash</p>
          </div>
          {geminiApiKey && <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />}
        </div>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Max tokens */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Max Tokens</p>
        </div>
        <input
          type="number"
          min={256}
          max={8192}
          step={256}
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Controls summary length. Default: 1024 · Range: 256–8192</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
