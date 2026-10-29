'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import EntryDetailModal from '@/components/entries/EntryDetailModal';
import type { ChatMessage as ChatMessageType } from '@/types';

const STORAGE_KEY = 'braindump-chat';
const MAX_HISTORY = 20;

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveMessages(msgs: ChatMessageType[]) {
    const trimmed = msgs.slice(-MAX_HISTORY);
    setMessages(trimmed);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  }

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;

    setInput('');
    setSending(true);

    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    saveMessages(newMessages);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let citations: Array<{ id: string; title: string }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Check if last line is JSON citations
        const lines = fullText.split('\n');
        const lastLine = lines[lines.length - 1].trim();

        if (lastLine.startsWith('{"citations"')) {
          try {
            const parsed = JSON.parse(lastLine);
            citations = parsed.citations ?? [];
            fullText = lines.slice(0, -1).join('\n');
          } catch { /* not complete yet */ }
        }

        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: fullText.replace(/\n\{"citations".*$/, ''), streaming: true }
              : m
          );
          return updated;
        });
      }

      // Finalize
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: fullText.replace(/\n\{"citations".*$/, ''), streaming: false, citations }
            : m
        );
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-MAX_HISTORY))); } catch { /* ignore */ }
        return updated;
      });
    } catch (err) {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsg.id
          ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
          : m
      ));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ask your brain</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>AI answers from your saved knowledge</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)' }}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center py-16"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--accent-dim)' }}
            >
              <MessageSquare className="w-7 h-7" style={{ color: 'var(--accent-text)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Ask anything about your saved knowledge
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Try: "What did I save about React hooks?" or "Summarize my finance notes"
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onOpenEntry={setOpenEntryId} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="flex items-end gap-3 p-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your saved knowledge… (⌘↵ to send)"
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl transition-all duration-150 shrink-0"
            style={
              !input.trim() || sending
                ? { background: 'var(--surface-raised)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                : { background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-accent)' }
            }
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Citation modal */}
      {openEntryId && (
        <EntryDetailModal
          entryId={openEntryId}
          onClose={() => setOpenEntryId(null)}
          onDeleted={() => setOpenEntryId(null)}
          onTagFilter={() => setOpenEntryId(null)}
        />
      )}
    </div>
  );
}
