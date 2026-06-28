"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Bug, Code, FlaskConical, Lightbulb, Shield, Siren, Sparkles, X } from "lucide-react";
import { BarChart, DonutChart } from "@/components/charts";
import { IssueFilters } from "@/components/IssueFilters";
import { ExportButton } from "@/components/ExportButton";
import type { IssueSeverity, IssueCategory } from "@/lib/types";

interface Issue {
  id: string;
  rule_id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  file_path: string;
  message: string;
  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;
  recommendation: string | null;
}

interface AnalysisData {
  id: string;
  score: number | null;
  security_score: number | null;
  performance_score: number | null;
  maintainability_score: number | null;
  summary: string | null;
  status: string;
  created_at: string;
  total_issues: number | null;
  error_message: string | null;
}

interface AnalysisResultsProps {
  analysis: AnalysisData;
  issues: Issue[];
  aiReports: { report_type: string; data: Record<string, unknown> }[];
  repoId: string;
}

function parseTool(ruleId: string): { name: string; color: string } | null {
  if (ruleId.startsWith("ruff-")) return { name: "Ruff", color: "bg-purple-50 text-purple-700 border-purple-200" };
  if (ruleId.startsWith("bandit-")) return { name: "Bandit", color: "bg-rose-50 text-rose-700 border-rose-200" };
  if (ruleId.startsWith("semgrep-")) return { name: "Semgrep", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  if (ruleId.startsWith("eslint-")) return { name: "ESLint", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  return null;
}

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
    security: Shield, performance: Bug, maintainability: Code,
    complexity: Bug, duplication: Lightbulb, code_style: Lightbulb, potential_bug: Siren
  };
  const Icon = icons[category] || AlertTriangle;
  return <Icon className="h-4 w-4" />;
}

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6", info: "#94a3b8"
};

function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function AnalysisResults({ analysis, issues, aiReports, repoId }: AnalysisResultsProps) {
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const aiScore = aiReports?.find((r) => r.report_type === "score") ?? null;
  const aiBugs = aiReports?.find((r) => r.report_type === "bugs") ?? null;
  const aiSecurity = aiReports?.find((r) => r.report_type === "security") ?? null;
  const aiRefactor = aiReports?.find((r) => r.report_type === "refactoring") ?? null;

  const scoreData = aiScore?.data ?? null;
  const bugsData = aiBugs?.data ?? null;
  const securityData = aiSecurity?.data ?? null;
  const refactorData = aiRefactor?.data ?? null;

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: SEVERITY_COLORS[k] || "#94a3b8" }));
  }, [issues]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ label: k.replace("_", " "), value: v, color: "#3b82f6" }));
  }, [issues]);

  const toolData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => {
      const tool = i.rule_id.split("-")[0] || "other";
      counts[tool] = (counts[tool] || 0) + 1;
    });
    const toolColors: Record<string, string> = { ruff: "#a855f7", bandit: "#e11d48", semgrep: "#06b6d4", eslint: "#6366f1" };
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: toolColors[k] || "#94a3b8" }));
  }, [issues]);

  const aiInsights = [aiBugs, aiSecurity, aiRefactor].filter(Boolean).map((r) => ({
    report_type: r!.report_type,
    data: r!.data as Record<string, unknown>,
  }));

  const totalPages = Math.ceil(issues.length / pageSize);

  return (
    <>
      {analysis.status === "completed" && (
        <>
          {/* Score cards */}
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

          {/* Charts */}
          {issues.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-white p-4">
                <DonutChart data={severityData} title="Severity Distribution" size={140} />
              </div>
              <div className="rounded-lg border bg-white p-4">
                <BarChart data={categoryData} title="By Category" height={160} />
              </div>
              <div className="rounded-lg border bg-white p-4">
                <BarChart data={toolData} title="By Tool" height={160} />
              </div>
            </div>
          )}

          {/* AI Score */}
          {aiScore && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">AI Code Quality Assessment</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["code_quality", "security", "performance", "maintainability"].map((key) => {
                  const val = scoreData?.[key];
                  return val !== undefined ? (
                    <div key={key} className="rounded bg-white px-3 py-2 text-center text-sm border border-blue-100">
                      <span className="text-lg font-bold text-blue-700">{val as number}</span>
                      <p className="text-xs text-blue-500 capitalize">{key.replace("_", " ")}</p>
                    </div>
                  ) : null;
                })}
              </div>
              {(scoreData as any)?.strengths?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Strengths</p>
                  <ul className="text-xs text-blue-600 space-y-0.5">
                    {(scoreData as any).strengths.map((s: string, i: number) => <li key={i}>+ {s}</li>)}
                  </ul>
                </div>
              )}
              {(scoreData as any)?.weaknesses?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-amber-700 mb-1">Weaknesses</p>
                  <ul className="text-xs text-amber-600 space-y-0.5">
                    {(scoreData as any).weaknesses.map((w: string, i: number) => <li key={i}>- {w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Issues with filters, pagination, export */}
          {issues.length > 0 ? (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-600">{issues.length} issue{issues.length !== 1 ? "s" : ""} found</h2>
                <ExportButton
                  data={{
                    analysis: analysis as unknown as Record<string, unknown>,
                    issues: issues as unknown as Record<string, unknown>[],
                    aiInsights: aiInsights as unknown as Record<string, unknown>[],
                  }}
                />
              </div>

              <IssueFilters issues={issues}>
                {(filtered) => (
                  <>
                    <div className="mt-3 space-y-2">
                      {filtered.slice(page * pageSize, (page + 1) * pageSize).map((issue, idx) => (
                        <div key={issue.id || idx} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={issue.severity} />
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  {issue.category}
                                </span>
                                {(() => {
                                  const tool = parseTool(issue.rule_id);
                                  return tool ? (
                                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${tool.color}`}>
                                      {tool.name}
                                    </span>
                                  ) : null;
                                })()}
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

                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                      <p>
                        Showing {filtered.length === 0 ? 0 : page * pageSize + 1}
                        –{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={page === 0}
                          onClick={() => setPage(page - 1)}
                          className="rounded border bg-white px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-slate-400">
                          Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / pageSize))}
                        </span>
                        <button
                          disabled={(page + 1) * pageSize >= filtered.length}
                          onClick={() => setPage(page + 1)}
                          className="rounded border bg-white px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </IssueFilters>
            </div>
          ) : (
            <div className="mt-8 text-center">
              <FlaskConical className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">No issues found. Clean code!</p>
            </div>
          )}

          {/* AI Insights */}
          {(aiBugs || aiSecurity || aiRefactor) && (
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI-powered insights
              </h2>

              {(bugsData as any)?.bugs?.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Detected Bugs</h3>
                  <div className="space-y-2">
                    {(bugsData as any).bugs.map((b: any, i: number) => (
                      <div key={i} className="rounded bg-white p-3 text-sm border border-amber-100">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={b.severity} />
                          <span className="font-medium text-amber-900">{b.title}</span>
                        </div>
                        <p className="text-xs text-amber-700">{b.description}</p>
                        {b.suggestion && (
                          <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Fix:</span> {b.suggestion}</p>
                        )}
                        <p className="mt-1 text-xs font-mono text-slate-400">{b.file_path}{b.line_start ? `:${b.line_start}` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(securityData as any)?.issues?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Security Vulnerabilities</h3>
                  <div className="space-y-2">
                    {(securityData as any).issues.map((s: any, i: number) => (
                      <div key={i} className="rounded bg-white p-3 text-sm border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={s.severity} />
                          <span className="font-medium text-red-900">{s.title}</span>
                          {s.cwe_reference && <span className="text-xs text-red-400 font-mono">{s.cwe_reference}</span>}
                        </div>
                        <p className="text-xs text-red-700">{s.description}</p>
                        {s.suggestion && (
                          <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Fix:</span> {s.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(refactorData as any)?.suggestions?.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Refactoring Suggestions</h3>
                  <div className="space-y-2">
                    {(refactorData as any).suggestions.map((r: any, i: number) => (
                      <div key={i} className="rounded bg-white p-3 text-sm border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                            r.estimated_impact === "high" ? "bg-red-50 text-red-700 border-red-200" :
                            r.estimated_impact === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>{r.estimated_impact}</span>
                          <span className="font-medium text-blue-900">{r.title}</span>
                        </div>
                        <p className="text-xs text-blue-700">{r.description}</p>
                        {r.suggestion && (
                          <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Suggestion:</span> {r.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {analysis.status === "failed" && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {analysis.error_message || "Analysis failed for an unknown reason."}
        </div>
      )}
    </>
  );
}
