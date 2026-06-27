import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileCode, GitBranch, Globe } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { detectLanguage } from "@/lib/github";

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    ts: "🔵", tsx: "⚛️", js: "🟡", jsx: "⚛️",
    py: "🐍", rs: "🦀", go: "🔷", java: "☕",
    rb: "💎", php: "🐘", css: "🎨", html: "🌐",
    json: "📋", md: "📝", yml: "⚙️", yaml: "⚙️",
    sql: "🗄️", sh: "💻", dockerfile: "🐳"
  };
  return icons[ext] || "📄";
}

export default async function RepositoryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: repo } = await supabase
    .from("repositories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!repo) notFound();

  const { data: files } = await supabase
    .from("repository_files")
    .select("id, path, language, size")
    .eq("repository_id", id)
    .order("path");

  const langs = repo.metadata && typeof repo.metadata === "object" && "languages" in repo.metadata
    ? (repo.metadata.languages as Record<string, number>)
    : null;

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/repositories">
            <ArrowLeft className="h-4 w-4" />
            Back to repositories
          </Link>
        </Button>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{repo.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {repo.source === "github" ? (
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4" />
                    {repo.full_name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    ZIP upload
                  </span>
                )}
                {repo.language && (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                    {repo.language}
                  </span>
                )}
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                  repo.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                  repo.status === "error" ? "bg-red-50 text-red-700" :
                  "bg-blue-50 text-blue-700"
                }`}>
                  {repo.status}
                </span>
              </div>
            </div>
            {repo.score && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {repo.score}
              </div>
            )}
          </div>

          {repo.description && (
            <p className="mt-4 text-sm text-slate-600">{repo.description}</p>
          )}
        </div>

        {langs && (
          <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-600">Languages</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(langs)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => (
                  <span key={lang} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
                    {lang} ({count})
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Files</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {files?.length || 0} files imported
            </p>
          </div>
          {files && files.length > 0 ? (
            <div className="divide-y">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 text-sm">{getFileIcon(file.path)}</span>
                    <span className="truncate text-sm font-mono">{file.path}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {file.language && (
                      <span className="text-xs text-muted-foreground">{file.language}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No files imported yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
