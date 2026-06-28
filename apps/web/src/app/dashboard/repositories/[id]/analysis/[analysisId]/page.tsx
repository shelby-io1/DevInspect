import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import GeneratePanel from "@/components/GeneratePanel";
import AnalysisResults from "@/components/AnalysisResults";
import ChatPanelWrapper from "@/components/ChatPanelWrapper";

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

  if (!analysis) notFound();

  const [{ data: repo }, { data: issues }, { data: aiReports }, { data: repoFiles }] = await Promise.all([
    supabase.from("repositories").select("name, language").eq("id", repoId).single(),
    supabase.from("analysis_issues").select("*").eq("analysis_id", analysisId).order("file_path"),
    supabase.from("ai_reports").select("*").eq("analysis_id", analysisId),
    supabase.from("repository_files").select("path, content").eq("repository_id", repoId).limit(30)
  ]);

  issues?.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

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

          <AnalysisResults
            analysis={analysis}
            issues={issues || []}
            aiReports={aiReports || []}
            repoId={repoId}
          />

          <GeneratePanel
            analysisId={analysisId}
            repositoryId={repoId}
            repoName={repo?.name}
            language={repo?.language}
            files={repoFiles?.map(f => ({ path: f.path, content: f.content || "" })) || []}
            folderStructure={repoFiles?.map(f => f.path).join("\n") || ""}
          />
        </div>

        <ChatPanelWrapper
          repositoryId={repoId}
          files={repoFiles?.map(f => ({ path: f.path, content: f.content || "" })) || []}
        />
      </div>
    </main>
  );
}
