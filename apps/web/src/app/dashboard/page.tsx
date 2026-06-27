import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ImportGitHubDialog } from "@/components/repositories/import-github-dialog";
import { UploadZipDialog } from "@/components/repositories/upload-zip-dialog";

export default async function DashboardPage() {
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

  const readyRepos = repos?.filter((r) => r.status === "ready") || [];
  const totalIssues = 0;
  const avgScore = readyRepos.length
    ? Math.round(readyRepos.reduce((sum, r) => sum + (r.score || 0), 0) / readyRepos.length)
    : null;

  const scoreCards = [
    { label: "Repositories", value: String(repos?.length || 0), detail: `${readyRepos.length} ready for review`, icon: Activity },
    { label: "Avg. score", value: avgScore ? String(avgScore) : "--", detail: avgScore ? "Across all repos" : "No data yet", icon: ShieldCheck },
    { label: "Total issues", value: String(totalIssues), detail: "Across all repositories", icon: Clock },
    { label: "Status", value: String(readyRepos.length), detail: "Repositories ready", icon: CheckCircle2 }
  ];

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Monitor review quality, repository health, and analysis activity from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ImportGitHubDialog />
            <UploadZipDialog />
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => (
            <article key={card.label} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">Recent repositories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest imported repositories.
              </p>
            </div>
            {repos && repos.length > 0 ? (
              <div className="divide-y">
                {repos.slice(0, 5).map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/dashboard/repositories/${repo.id}`}
                    className="grid gap-3 p-5 transition hover:bg-slate-50 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <h3 className="font-medium">{repo.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {repo.source === "github" ? repo.full_name : "ZIP upload"}
                        {" · "}
                        {new Date(repo.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                        repo.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                        repo.status === "error" ? "bg-red-50 text-red-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {repo.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-muted-foreground">No repositories imported yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the buttons above to import from GitHub or upload a ZIP.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Get started quickly.</p>
            </div>
            <div className="grid gap-3 p-5">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard/repositories">
                  <ShieldCheck className="h-4 w-4" />
                  View all repositories
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
