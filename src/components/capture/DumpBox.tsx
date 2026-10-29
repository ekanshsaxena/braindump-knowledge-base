'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link as LinkIcon, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from '@/components/Toast';

interface DumpBoxProps {
  onEntryAdded: () => void;
}

type SaveState = 'idle' | 'saving' | 'thinking' | 'done';

const URL_RE = /https?:\/\/[^\s]+/;

export default function DumpBox({ onEntryAdded }: DumpBoxProps) {
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('braindump-draft');
    if (draft) setContent(draft);
  }, []);

  // Save draft on every keystroke
  useEffect(() => {
    if (content) {
      localStorage.setItem('braindump-draft', content);
    } else {
      localStorage.removeItem('braindump-draft');
    }
  }, [content]);

  // 'N' shortcut to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName ?? '')) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const hasUrl = URL_RE.test(content);
  const canSave = content.trim().length > 0 && saveState === 'idle';

  async function handleSave() {
    if (!canSave) return;
    setSaveState('saving');

    try {
      await new Promise((r) => setTimeout(r, 300));
      setSaveState('thinking');

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) throw new Error('Failed');

      setSaveState('done');
      setContent('');
      localStorage.removeItem('braindump-draft');
      toast.success('Saved and categorized!');

      setTimeout(() => {
        setSaveState('idle');
        onEntryAdded();
      }, 800);
    } catch {
      setSaveState('idle');
      toast.error('Failed to save. Try again.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setContent('');
      textareaRef.current?.blur();
    }
  }

  const buttonLabel = saveState === 'saving' ? 'Saving…' : saveState === 'thinking' ? 'Thinking…' : saveState === 'done' ? 'Saved!' : 'Save';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Dump your thoughts, paste a link, or save anything you want to remember…"
          rows={4}
          className="w-full resize-none px-5 pt-4 pb-2 text-sm bg-transparent outline-none placeholder-[var(--text-muted)]"
          style={{ color: 'var(--text-primary)' }}
        />

        {content && (
          <button
            onClick={() => setContent('')}
            className="absolute top-3 right-3 p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-5 pb-4 pt-1">
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {hasUrl && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--accent-text)' }}
              >
                <LinkIcon className="w-3 h-3" />
                <span>Link detected</span>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ⌘↵ to save · N to focus
          </span>
        </div>

        <motion.button
          onClick={handleSave}
          disabled={!canSave}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={
            !canSave
              ? { background: 'var(--surface-raised)', color: 'var(--text-muted)', cursor: 'not-allowed' }
              : { background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-accent)' }
          }
        >
          {saveState === 'idle' && <Send className="w-3.5 h-3.5" />}
          {(saveState === 'saving' || saveState === 'thinking') && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          {saveState === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {buttonLabel}
        </motion.button>
      </div>
    </div>
  );
}
