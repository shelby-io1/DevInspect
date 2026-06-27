export default function RepositoriesLoading() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
