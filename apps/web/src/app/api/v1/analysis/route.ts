import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeRepository } from "@/lib/analysis";

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

    const result = analyzeRepository(files);

    const issueRows = result.issues.map((issue) => ({
      analysis_id: analysis.id,
      rule_id: issue.rule_id,
      severity: issue.severity,
      category: issue.category,
      file_path: issue.file_path,
      line_start: issue.line_start,
      line_end: issue.line_end,
      message: issue.message,
      recommendation: issue.recommendation,
      code_snippet: issue.code_snippet
    }));

    const batchSize = 50;
    for (let i = 0; i < issueRows.length; i += batchSize) {
      const batch = issueRows.slice(i, i + batchSize);
      const { error: issuesError } = await supabase
        .from("analysis_issues")
        .insert(batch);

      if (issuesError) {
        await supabase
          .from("analyses")
          .update({ status: "failed", error_message: issuesError.message, completed_at: new Date().toISOString() })
          .eq("id", analysis.id);
        return NextResponse.json({ error: issuesError.message }, { status: 500 });
      }
    }

    await supabase
      .from("analyses")
      .update({
        status: "completed",
        score: result.score,
        security_score: result.security_score,
        performance_score: result.performance_score,
        maintainability_score: result.maintainability_score,
        total_issues: result.issues.length,
        summary: result.summary,
        completed_at: new Date().toISOString()
      })
      .eq("id", analysis.id);

    await supabase
      .from("repositories")
      .update({ score: result.score })
      .eq("id", repository_id);

    return NextResponse.json({
      id: analysis.id,
      status: "completed",
      score: result.score,
      security_score: result.security_score,
      performance_score: result.performance_score,
      maintainability_score: result.maintainability_score,
      total_issues: result.issues.length,
      summary: result.summary
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
