'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function AccountTab() {
  const { user } = useUser();
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braindump-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch { toast.error('Export failed'); }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm('Delete ALL your entries? This cannot be undone.');
    if (!confirmed) return;
    const confirmed2 = window.confirm('Are you really sure? All entries will be permanently deleted.');
    if (!confirmed2) return;
    setDeleting(true);
    try {
      await fetch('/api/entries?all=true', { method: 'DELETE' });
      toast.success('All entries deleted');
    } catch { toast.error('Failed to delete entries'); }
    finally { setDeleting(false); }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* User info */}
      {user && (
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          {user.imageUrl && (
            <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      )}

      {/* Export */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Export your data</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Download all your entries as a JSON file.</p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Danger Zone</p>
        </div>
        <button
          onClick={handleDeleteAll}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Deleting…' : 'Delete all entries'}
        </button>
      </div>
    </div>
  );
}
