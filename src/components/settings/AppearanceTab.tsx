'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, LayoutGrid, List } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [defaultView, setDefaultView] = useState<'card' | 'list'>('card');

  useEffect(() => {
    const saved = localStorage.getItem('braindump-view') as 'card' | 'list' | null;
    if (saved) setDefaultView(saved);
  }, []);

  function handleViewChange(v: 'card' | 'list') {
    setDefaultView(v);
    localStorage.setItem('braindump-view', v);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Theme */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Theme</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                theme === t
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {t === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Default view */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Default View</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('card')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={
              defaultView === 'card'
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Card grid
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={
              defaultView === 'list'
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>
    </div>
  );
}
