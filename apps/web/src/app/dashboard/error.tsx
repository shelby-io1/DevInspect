"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <div className="max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Dashboard failed to load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Refresh the workspace and try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Reload
        </Button>
      </div>
    </main>
  );
}
