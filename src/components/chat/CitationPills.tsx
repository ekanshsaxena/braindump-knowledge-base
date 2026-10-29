'use client';

interface Citation {
  id: string;
  title: string;
}

interface CitationPillsProps {
  citations: Citation[];
  onOpen: (id: string) => void;
}

export default function CitationPills({ citations, onOpen }: CitationPillsProps) {
  if (citations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent-text)',
            border: '1px solid var(--accent-border)',
          }}
        >
          <span className="opacity-60">[{i + 1}]</span>
          <span className="truncate max-w-[120px]">{c.title}</span>
        </button>
      ))}
    </div>
  );
}
