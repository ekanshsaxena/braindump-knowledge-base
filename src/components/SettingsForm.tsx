'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, Loader2, Key, Zap, Plus, X, Hash, Bot, Sparkles, Tag } from 'lucide-react';
import { AppSettings, UserCategory } from '@/types';
import { toast } from './Toast';

type Tab = 'ai' | 'categories';

export default function SettingsForm() {
  const [tab, setTab] = useState<Tab>('ai');
  const [settings, setSettings] = useState<AppSettings>({
    anthropicApiKey: '',
    geminiApiKey: '',
    priority: 'anthropic',
    maxTokens: 1024,
    userCategories: [],
    onboardingCompleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          anthropicApiKey: data.anthropicApiKey ?? '',
          geminiApiKey: data.geminiApiKey ?? '',
          priority: data.priority ?? 'anthropic',
          maxTokens: data.maxTokens ?? 1024,
          userCategories: data.userCategories ?? [],
          onboardingCompleted: data.onboardingCompleted ?? false,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (settings.userCategories.some((c) => c.name === name)) {
      setNewCatName(''); setNewCatEmoji(''); return;
    }
    setSettings((s) => ({ ...s, userCategories: [...s.userCategories, { name, emoji: newCatEmoji || '📌' }] }));
    setNewCatName(''); setNewCatEmoji('');
  };

  const removeCategory = (name: string) =>
    setSettings((s) => ({ ...s, userCategories: s.userCategories.filter((c) => c.name !== name) }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl w-fit">
        {([
          { id: 'ai', label: 'AI & Providers', icon: Bot },
          { id: 'categories', label: 'Categories', icon: Tag },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'ai' && (
        <div className="space-y-4">
          {/* API Keys — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Anthropic */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-base">🤖</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Anthropic (Claude)</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">claude-haiku-4-5</p>
                </div>
                {settings.anthropicApiKey && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={settings.anthropicApiKey}
                  onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-violet-400/60 dark:focus:border-violet-500/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition-all"
                />
                <button onClick={() => setShowAnthropic(!showAnthropic)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {showAnthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Gemini */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-base">✨</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Google Gemini</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">gemini-2.5-flash</p>
                </div>
                {settings.geminiApiKey && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-violet-400/60 dark:focus:border-violet-500/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition-all"
                />
                <button onClick={() => setShowGemini(!showGemini)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Priority + Max Tokens — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-500" />
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Priority Provider</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['anthropic', 'gemini'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSettings({ ...settings, priority: p })}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 border ${
                      settings.priority === p
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    {p === 'anthropic' ? '🤖 Anthropic' : '✨ Gemini'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3">Auto-falls back if primary fails.</p>
            </div>

            {/* Max Tokens */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Max Tokens</p>
              </div>
              <input
                type="number"
                min={256}
                max={8192}
                step={256}
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: Number(e.target.value) })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-violet-400/60 dark:focus:border-violet-500/50 text-zinc-900 dark:text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              />
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3">
                Controls summary length. Default: 1024 · Range: 256–8192.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Your Interest Categories</p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-5">
            AI maps every new entry to all matching categories from this list.
          </p>

          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              placeholder="😀"
              className="w-14 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2.5 text-center text-lg outline-none focus:border-violet-400/60 dark:focus:border-violet-500/50"
              maxLength={2}
            />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g. Side Projects"
              className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-violet-400/60 dark:focus:border-violet-500/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            />
            <button
              onClick={addCategory}
              disabled={!newCatName.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {settings.userCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {settings.userCategories.map((cat: UserCategory) => (
                <span
                  key={cat.name}
                  className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 px-3 py-1.5 rounded-xl text-sm font-medium"
                >
                  {cat.emoji} {cat.name}
                  <button onClick={() => removeCategory(cat.name)} className="hover:opacity-70 transition-opacity ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
                <Tag className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No categories yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Add some above to guide the AI</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all duration-150"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
