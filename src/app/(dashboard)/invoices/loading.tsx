export default function InvoicesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading invoices" className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-card" />
          <div className="h-4 w-28 rounded bg-card" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-card" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Table Header */}
        <div className="flex gap-6 border-b border-border px-6 py-3.5">
          {[96, 120, 96, 80, 72, 80, 72].map((w, i) => (
            <div key={i} className="h-3 rounded bg-surface" style={{ width: w }} />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-border px-6 py-4 last:border-b-0"
          >
            <div className="h-4 w-24 rounded bg-surface" />
            <div className="h-4 w-32 rounded bg-surface" />
            <div className="h-4 w-20 rounded bg-surface" />
            <div className="h-4 w-20 rounded bg-surface" />
            <div className="h-5 w-16 rounded-lg bg-surface" />
            <div className="h-4 w-24 rounded bg-surface" />
            <div className="h-4 w-24 rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
