import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeRepository } from "@/lib/analysis";
import { env } from "@/lib/env";

const BACKEND_URL = env.BACKEND_URL;

interface RawIssue {
  rule_id: string; severity: string; category: string; file_path: string;
  line_start: number | null; line_end: number | null;
  message: string; recommendation: string | null; code_snippet: string | null;
}

async function runPythonTools(files: { path: string; content: string }[]): Promise<{ issues: RawIssue[] }> {
  const allIssues: RawIssue[] = [];
  try {
    const res = await fetch(`${BACKEND_URL}/analyze/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(120000)
    });
    if (!res.ok) return { issues: allIssues };
    const results: { tool: string; issues: RawIssue[] }[] = await res.json();
    for (const result of results) {
      for (const issue of result.issues) {
        allIssues.push(issue);
      }
    }
  } catch {
    // Python backend unavailable
  }
  return { issues: allIssues };
}

async function runAIAnalysis(files: { path: string; content: string }[], existingIssues: RawIssue[]) {
  const payload = { files, existing_issues: existingIssues };
  const headers = { "Content-Type": "application/json" };

  async function call(endpoint: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/analyze/ai/${endpoint}`, {
        method: "POST", headers, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000)
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  const [bugs, security, refactor, score] = await Promise.all([
    call("bugs"), call("security"), call("refactor"), call("score")
  ]);

  return { bugs, security, refactor, score };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repository_id } = await request.json();
    if (!repository_id) {
      return NextResponse.json({ error: "repository_id is required" }, { status: 400 });
    }

    const { data: repo } = await supabase
      .from("repositories")
      .select("*")
      .eq("id", repository_id)
      .eq("user_id", user.id)
      .single();

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const { data: files } = await supabase
      .from("repository_files")
      .select("*")
      .eq("repository_id", repository_id);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files found in repository" }, { status: 400 });
    }

    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        repository_id,
        user_id: user.id,
        status: "running",
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !analysis) {
      return NextResponse.json({ error: insertError?.message || "Failed to start analysis" }, { status: 500 });
    }

    // Run static analysis and AI analysis in parallel
    const fileContents = files.filter((f) => f.content).map((f) => ({ path: f.path, content: f.content! }));
    const [jsResult, pyResult, aiResult] = await Promise.all([
      Promise.resolve(analyzeRepository(files)),
      runPythonTools(fileContents),
      runAIAnalysis(fileContents, [])
    ]);

    const allIssues = [
      ...jsResult.issues.map((i) => ({
        analysis_id: analysis.id,
        rule_id: i.rule_id, severity: i.severity, category: i.category,
        file_path: i.file_path, line_start: i.line_start, line_end: i.line_end,
        message: i.message, recommendation: i.recommendation, code_snippet: i.code_snippet
      })),
      ...pyResult.issues.map((i) => ({
        analysis_id: analysis.id,
        rule_id: i.rule_id, severity: i.severity, category: i.category,
        file_path: i.file_path, line_start: i.line_start, line_end: i.line_end,
        message: i.message, recommendation: i.recommendation, code_snippet: i.code_snippet
      }))
    ];

    // Store static analysis issues
    const batchSize = 50;
    for (let i = 0; i < allIssues.length; i += batchSize) {
      const batch = allIssues.slice(i, i + batchSize);
      const { error: issuesError } = await supabase.from("analysis_issues").insert(batch);
      if (issuesError) {
        await supabase.from("analyses").update({
          status: "failed", error_message: issuesError.message, completed_at: new Date().toISOString()
        }).eq("id", analysis.id);
        return NextResponse.json({ error: issuesError.message }, { status: 500 });
      }
    }

    // Store AI reports
    const aiReports: { report_type: string; data: any }[] = [];
    if (aiResult.bugs) aiReports.push({ report_type: "bugs", data: aiResult.bugs });
    if (aiResult.security) aiReports.push({ report_type: "security", data: aiResult.security });
    if (aiResult.refactor) aiReports.push({ report_type: "refactoring", data: aiResult.refactor });
    if (aiResult.score) aiReports.push({ report_type: "score", data: aiResult.score });

    for (const report of aiReports) {
      await supabase.from("ai_reports").insert({
        analysis_id: analysis.id,
        report_type: report.report_type,
        summary: report.data.summary || null,
        data: report.data
      }).maybeSingle();
    }

    // Calculate scores
    const totalIssues = allIssues.length;
    const securityIssues = allIssues.filter((i) => i.category === "security").length;
    const performanceIssues = allIssues.filter((i) => i.category === "performance").length;
    const maintainabilityIssues = allIssues.filter((i) =>
      ["maintainability", "complexity", "duplication", "code_style"].includes(i.category)
    ).length;

    const score = Math.max(0, Math.min(100,
      Math.round(100 -
        (allIssues.filter((i) => i.severity === "critical").length * 10) -
        (allIssues.filter((i) => i.severity === "high").length * 5) -
        (allIssues.filter((i) => i.severity === "medium").length * 2) -
        (allIssues.filter((i) => i.severity === "low").length * 0.5)
      )
    ));

    const securityScore = securityIssues > 0
      ? Math.max(0, 100 - (allIssues.filter((i) => i.severity === "critical" || i.severity === "high").length * 5))
      : 100;

    const perfScore = performanceIssues > 0
      ? Math.max(0, 100 - performanceIssues * 3)
      : 100;

    const maintScore = maintainabilityIssues > 0
      ? Math.max(0, 100 - maintainabilityIssues * 2)
      : 100;

    const summary = `Found ${totalIssues} issue${totalIssues !== 1 ? "s" : ""} ` +
      `(${allIssues.filter((i) => i.severity === "critical").length} critical, ` +
      `${allIssues.filter((i) => i.severity === "high").length} high). ` +
      `Security: ${securityScore}/100, Performance: ${perfScore}/100, Maintainability: ${maintScore}/100.`;

    await supabase.from("analyses").update({
      status: "completed", score, security_score: securityScore,
      performance_score: perfScore, maintainability_score: maintScore,
      total_issues: totalIssues, summary, completed_at: new Date().toISOString()
    }).eq("id", analysis.id);

    await supabase.from("repositories").update({ score }).eq("id", repository_id);

    const hasAi = aiReports.length > 0;

    return NextResponse.json({
      id: analysis.id, status: "completed", score,
      security_score: securityScore, performance_score: perfScore,
      maintainability_score: maintScore, total_issues: totalIssues,
      summary, has_ai_reports: hasAi
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
