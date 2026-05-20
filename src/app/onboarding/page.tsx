'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, X, Check, Loader2, ArrowRight } from 'lucide-react';
import { UserCategory } from '@/types';
import { toast } from '@/components/Toast';

const SUGGESTED = [
  { name: 'Startup', emoji: '🚀' },
  { name: 'Software Engineering', emoji: '💻' },
  { name: 'System Design', emoji: '🏗️' },
  { name: 'AI/ML', emoji: '🤖' },
  { name: 'Healthy Lifestyle', emoji: '🏃' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Finance', emoji: '💰' },
  { name: 'Career', emoji: '💼' },
  { name: 'Learning', emoji: '📚' },
  { name: 'Product', emoji: '📦' },
  { name: 'Design', emoji: '🎨' },
  { name: 'Mental Health', emoji: '🧘' },
  { name: 'Networking', emoji: '🤝' },
  { name: 'Research', emoji: '🔬' },
  { name: 'Business', emoji: '📊' },
  { name: 'Travel', emoji: '✈️' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserCategory[]>([]);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  const isSelected = (name: string) => selected.some((c) => c.name === name);

  const toggle = (cat: UserCategory) => {
    setSelected((prev) =>
      isSelected(cat.name) ? prev.filter((c) => c.name !== cat.name) : [...prev, cat]
    );
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    if (isSelected(name)) { setCustomName(''); setCustomEmoji(''); return; }
    setSelected((prev) => [...prev, { name, emoji: customEmoji || '📌' }]);
    setCustomName('');
    setCustomEmoji('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCategories: selected, onboardingCompleted: true }),
      });
      toast.success('Categories saved!');
      router.push('/');
    } catch {
      toast.error('Failed to save. Try again.');
      setSaving(false);
    }
  };

  const skip = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userCategories: [], onboardingCompleted: true }),
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Set up your knowledge base</h1>
            <p className="text-sm text-zinc-500">
              Pick the areas you care about — AI will map new entries to these categories automatically.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Suggested categories
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((cat) => {
              const active = isSelected(cat.name);
              return (
                <motion.button
                  key={cat.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggle(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                    active
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                  {active && <Check className="w-3 h-3 ml-0.5" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Add custom category
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="😀"
              className="w-14 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 text-center text-lg outline-none focus:border-violet-500/50"
              maxLength={2}
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="e.g. Side Projects"
              className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-violet-500/50 text-zinc-100 placeholder-zinc-600 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            />
            <button
              onClick={addCustom}
              disabled={!customName.trim()}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2.5 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {selected.filter((c) => !SUGGESTED.some((s) => s.name === c.name)).length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex flex-wrap gap-2 overflow-hidden">
                {selected.filter((c) => !SUGGESTED.some((s) => s.name === c.name)).map((cat) => (
                  <span key={cat.name} className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
                    {cat.emoji} {cat.name}
                    <button onClick={() => toggle(cat)} className="hover:opacity-70 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-sm text-zinc-500 text-center">
            {selected.length} categories selected
          </motion.div>
        )}

        <div className="flex gap-3">
          <button
            onClick={skip}
            className="px-5 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-2.5 rounded-xl transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Get started'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
