export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-card" />
          <div className="h-4 w-36 rounded bg-card" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-card" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-36 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
