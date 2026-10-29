'use client';

import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsShell from '@/components/settings/SettingsShell';

export default function SettingsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-5 h-14"
        style={{
          background: 'rgba(10,10,15,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>BrainDump</span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Settings</span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-4xl mx-auto px-6 py-10"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Configure your AI, categories, appearance and account.
          </p>
        </div>
        <SettingsShell />
      </motion.div>
    </div>
  );
}
