import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, GitBranch, Globe, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ImportGitHubDialog } from "@/components/repositories/import-github-dialog";
import { UploadZipDialog } from "@/components/repositories/upload-zip-dialog";
import { DeleteRepositoryButton } from "./delete-button";
import type { Repository } from "@/lib/types";

function getStatusBadge(status: Repository["status"]) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-50 text-emerald-700",
    importing: "bg-blue-50 text-blue-700",
    error: "bg-red-50 text-red-700",
    pending: "bg-slate-50 text-slate-600"
  };
  return styles[status] || styles.pending;
}

export default async function RepositoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: repos, error: reposError } = await supabase
    .from("repositories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (reposError) {
    throw new Error(reposError.message);
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Repositories</h1>
            <p className="mt-2 text-slate-600">
              Import or upload repositories for analysis.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ImportGitHubDialog />
            <UploadZipDialog />
          </div>
        </div>

        {(!repos || repos.length === 0) ? (
          <div className="mt-16 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-600">No repositories yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Import a GitHub repository or upload a ZIP file to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between rounded-lg border bg-white p-5 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{repo.name}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${getStatusBadge(repo.status)}`}>
                      {repo.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {repo.source === "github" ? (
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3.5 w-3.5" />
                        {repo.full_name || repo.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        ZIP upload
                      </span>
                    )}
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                        {repo.language}
                      </span>
                    )}
                    {repo.metadata && typeof repo.metadata === "object" && "file_count" in repo.metadata && (
                      <span>{String(repo.metadata.file_count)} files</span>
                    )}
                    <span>
                      {new Date(repo.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {repo.status === "ready" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/repositories/${repo.id}`}>
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  {repo.source === "github" && repo.url && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={repo.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <DeleteRepositoryButton repoId={repo.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
