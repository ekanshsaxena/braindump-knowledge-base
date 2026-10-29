'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import CitationPills from './CitationPills';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenEntry: (id: string) => void;
}

export default function ChatMessage({ message, onOpenEntry }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
        {isUser ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {message.content}
          </div>
        ) : (
          <div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="prose prose-sm prose-invert max-w-none" style={{ color: 'var(--text-secondary)' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.streaming && (
                <span
                  className="inline-block w-2 h-4 ml-1 animate-pulse rounded-sm"
                  style={{ background: 'var(--accent)', verticalAlign: 'middle' }}
                />
              )}
            </div>
            {message.citations && message.citations.length > 0 && (
              <CitationPills citations={message.citations} onOpen={onOpenEntry} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
