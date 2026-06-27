export default function AnalysisDetailLoading() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-4 h-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
