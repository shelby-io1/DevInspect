import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Bug, Code, FlaskConical, Lightbulb, RefreshCw, Shield, Siren, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { IssueCategory, IssueSeverity } from "@/lib/types";

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const styles: Record<string, string> = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
    info: "bg-slate-50 text-slate-600 border-slate-200"
  };
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${styles[severity] || styles.info}`}>
      {severity}
    </span>
  );
}

function CategoryIcon({ category }: { category: IssueCategory }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    security: Shield, performance: Target, maintainability: Code,
    complexity: Bug, duplication: CopyIcon, code_style: Lightbulb, potential_bug: Siren
  };
  const Icon = icons[category] || AlertTriangle;
  return <Icon className="h-4 w-4" />;
}

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default async function AnalysisDetailPage({
  params
}: {
  params: Promise<{ id: string; analysisId: string }>;
}) {
  const { id: repoId, analysisId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (!analysis || analysis.user_id !== user.id) notFound();

  const { data: issues } = await supabase
    .from("analysis_issues")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("file_path");

  issues?.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  const byCategory = issues?.reduce<Record<string, typeof issues>>((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {}) ?? {};

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/dashboard/repositories/${repoId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to repository
          </Link>
        </Button>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Analysis results</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(analysis.created_at).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <span className={`rounded-md px-3 py-1 text-sm font-medium capitalize ${
              analysis.status === "completed" ? "bg-emerald-50 text-emerald-700" :
              analysis.status === "failed" ? "bg-red-50 text-red-700" :
              "bg-blue-50 text-blue-700"
            }`}>
              {analysis.status}
            </span>
          </div>

          {analysis.status === "completed" && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Overall score", value: analysis.score },
                  { label: "Security", value: analysis.security_score },
                  { label: "Performance", value: analysis.performance_score },
                  { label: "Maintainability", value: analysis.maintainability_score }
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border bg-slate-50 p-4 text-center">
                    <p className={`text-3xl font-bold ${scoreColor(value)}`}>
                      {value ?? "--"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {analysis.summary && (
                <div className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm text-slate-700">
                  {analysis.summary}
                </div>
              )}

              {issues && issues.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-slate-600">
                    {issues.length} issue{issues.length !== 1 ? "s" : ""} found
                  </h2>
                  <div className="mt-3 space-y-2">
                    {issues.map((issue, idx) => (
                      <div key={issue.id || idx} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={issue.severity} />
                              <span className="text-xs font-medium text-muted-foreground uppercase">
                                {issue.category}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">{issue.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground font-mono">
                              {issue.file_path}
                              {issue.line_start ? `:${issue.line_start}${issue.line_end !== issue.line_start ? `-${issue.line_end}` : ""}` : ""}
                            </p>
                            {issue.code_snippet && (
                              <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-200">
                                <code>{issue.code_snippet}</code>
                              </pre>
                            )}
                            {issue.recommendation && (
                              <p className="mt-2 text-xs text-slate-600">
                                <span className="font-medium">Fix:</span> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <FlaskConical className="mx-auto h-10 w-10 text-emerald-400" />
                  <p className="mt-2 text-sm text-muted-foreground">No issues found. Clean code!</p>
                </div>
              )}
            </>
          )}

          {analysis.status === "failed" && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {analysis.error_message || "Analysis failed for an unknown reason."}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function CopyIcon(props: { className?: string }) {
  const { className, ...rest } = props;
  return (
    <svg {...rest} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
