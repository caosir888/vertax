export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-zinc-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <div className="h-4 w-20 rounded bg-zinc-200" />
            <div className="h-8 w-28 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-zinc-200" />
        <div className="h-48 w-full rounded bg-zinc-100" />
      </div>
    </div>
  );
}
