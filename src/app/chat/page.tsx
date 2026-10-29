'use client';

import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-dim)' }}
      >
        <MessageSquare className="w-7 h-7" style={{ color: 'var(--accent-text)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        AI Chat — coming in Task 7
      </p>
    </div>
  );
}
