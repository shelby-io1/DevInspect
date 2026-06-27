export default function DashboardLoading() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-36 animate-pulse rounded-lg border bg-white" key={index} />
          ))}
        </div>
        <div className="mt-6 h-96 animate-pulse rounded-lg border bg-white" />
      </div>
    </main>
  );
}
