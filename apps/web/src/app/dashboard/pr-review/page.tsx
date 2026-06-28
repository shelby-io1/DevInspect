"use client";

import { useState } from "react";
import { GitPullRequest, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PRReviewPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleReview() {
    if (!repoUrl || !prNumber) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/v1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, prNumber: parseInt(prNumber) }),
        signal: AbortSignal.timeout(120000),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Review failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "PR review failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <GitPullRequest className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-slate-950">PR Review</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a GitHub pull request URL to review.
        </p>

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Repository URL (e.g. https://github.com/user/repo)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1 rounded-md border bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="PR #"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="w-24 rounded-md border bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 text-center"
            />
            <Button onClick={handleReview} disabled={loading || !repoUrl || !prNumber}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Review
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className={`rounded-lg border p-4 ${
              result.approved ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-semibold ${result.approved ? "text-emerald-800" : "text-amber-800"}`}>
                  {result.approved ? "Approved" : "Changes requested"}
                </span>
              </div>
              <p className="text-sm">{result.summary}</p>
            </div>

            {(result.suggestions as any[])?.length > 0 && (
              <div className="rounded-lg border bg-white p-4">
                <h3 className="text-sm font-semibold mb-2">Suggestions</h3>
                <ul className="space-y-1">
                  {(result.suggestions as string[]).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.issues as any[])?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Issues found ({(result.issues as any[]).length})</h3>
                {(result.issues as any[]).map((issue: any, i: number) => (
                  <div key={i} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                        issue.severity === "high" ? "bg-red-50 text-red-700 border-red-200" :
                        issue.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{issue.type}</span>
                      <span className="text-xs font-medium">{issue.title}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {issue.file}{issue.line_start ? `:${issue.line_start}${issue.line_end !== issue.line_start ? `-${issue.line_end}` : ""}` : ""}
                    </p>
                    <p className="mt-1 text-sm">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-medium">Fix:</span> {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
