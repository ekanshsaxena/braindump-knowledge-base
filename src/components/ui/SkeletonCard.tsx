export default function SkeletonCard() {
  return (
    <div
      className="rounded-2xl h-52 animate-pulse"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full" style={{ background: 'var(--surface-raised)' }} />
          <div className="h-5 w-16 rounded-full" style={{ background: 'var(--surface-raised)' }} />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded" style={{ background: 'var(--surface-raised)' }} />
          <div className="h-4 w-3/4 rounded" style={{ background: 'var(--surface-raised)' }} />
        </div>
        <div className="h-3 w-full rounded" style={{ background: 'var(--surface-raised)' }} />
        <div className="flex gap-1 mt-4">
          <div className="h-5 w-14 rounded-full" style={{ background: 'var(--surface-raised)' }} />
          <div className="h-5 w-10 rounded-full" style={{ background: 'var(--surface-raised)' }} />
          <div className="h-5 w-16 rounded-full" style={{ background: 'var(--surface-raised)' }} />
        </div>
      </div>
    </div>
  );
}
