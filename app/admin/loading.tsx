// app/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-slate-200" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-2xl bg-white ring-1 ring-slate-200" />
    </div>
  );
}
