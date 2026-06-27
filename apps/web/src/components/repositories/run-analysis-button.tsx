"use client";

import { useState, useCallback } from "react";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunAnalysisButton({ repositoryId }: { repositoryId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; score: number; total_issues: number } | null>(null);

  const handleRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v1/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository_id: repositoryId })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [repositoryId]);

  return (
    <div>
      <Button onClick={handleRun} disabled={loading} size="lg">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading ? "Analyzing..." : result ? "Re-run analysis" : "Run analysis"}
      </Button>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Analysis complete!</p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Score:</span>
              <span className="ml-2 font-semibold">{result.score}/100</span>
            </div>
            <div>
              <span className="text-muted-foreground">Issues:</span>
              <span className="ml-2 font-semibold">{result.total_issues}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
