import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get("analysis_id");

  if (!analysisId) {
    return NextResponse.json({ error: "analysis_id query parameter is required" }, { status: 400 });
  }

  const { data: analysis } = await supabase
    .from("analyses").select("*").eq("id", analysisId).single();

  if (!analysis || analysis.user_id !== user.id) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const [{ data: issues }, { data: aiReports }] = await Promise.all([
    supabase.from("analysis_issues").select("*").eq("analysis_id", analysisId),
    supabase.from("ai_reports").select("*").eq("analysis_id", analysisId)
  ]);

  const summary = issues?.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const report = {
    report_id: crypto.randomUUID(),
    generated_at: new Date().toISOString(),
    analysis: {
      id: analysis.id,
      repository_id: analysis.repository_id,
      status: analysis.status,
      score: analysis.score,
      security_score: analysis.security_score,
      performance_score: analysis.performance_score,
      maintainability_score: analysis.maintainability_score,
      total_issues: analysis.total_issues,
      summary: analysis.summary,
      started_at: analysis.started_at,
      completed_at: analysis.completed_at,
    },
    issues: {
      total: issues?.length ?? 0,
      by_severity: summary,
      items: issues?.map((i) => ({
        rule_id: i.rule_id, severity: i.severity, category: i.category,
        file_path: i.file_path, line_start: i.line_start, line_end: i.line_end,
        message: i.message, recommendation: i.recommendation, code_snippet: i.code_snippet,
      })) ?? [],
    },
    ai_insights: aiReports?.map((r) => ({
      report_type: r.report_type,
      summary: r.summary,
      data: r.data,
    })) ?? [],
    summary_text: analysis.summary || `Analysis found ${issues?.length ?? 0} issues.`,
  };

  return NextResponse.json(report);
}
