import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';

export const metadata = { title: 'Settings · BrainDump' };

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/60 transition-colors duration-200">
        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">BrainDump</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-sm text-zinc-500">Settings</span>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-1">Settings</h1>
          <p className="text-sm text-zinc-500">
            Configure your AI providers for smart auto-categorization.
          </p>
        </div>
        <SettingsForm />
      </div>
    </div>
  );
}
