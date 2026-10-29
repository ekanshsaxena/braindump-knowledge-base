'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Settings, Sun, Moon, X } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import { useTheme } from '@/hooks/useTheme';
import type { Category, Tag } from '@/types';

export default function ChatPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Sidebar data — empty defaults; categories/tags not critical for chat
  const categories: Category[] = [];
  const tags: Tag[] = [];

  const sidebar = (
    <Sidebar
      activeTab="chat"
      categories={categories}
      tags={tags}
      selectedCategory="all"
      selectedTag=""
      onCategorySelect={() => {}}
      onTagSelect={() => {}}
      entryCount={0}
      open={sidebarOpen}
    />
  );

  return (
    <AppShell sidebar={sidebar}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 h-14 shrink-0"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Chat with your brain
        </p>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link href="/settings" className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <ChatInterface />
      </motion.div>
    </AppShell>
  );
}
