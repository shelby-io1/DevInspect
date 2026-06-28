import { redirect } from "next/navigation";
import Link from "next/link";
import { GitBranch, LayoutDashboard, Users, GitPullRequest } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { HeaderClient, HeaderActions } from "@/components/header-client";
import { TeamsNavBadge } from "@/components/teams-nav-badge";
import { ErrorBoundary } from "@/components/error-boundary";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Repositories", icon: GitBranch, href: "/dashboard/repositories" },
  { label: "Teams", icon: Users, href: "/dashboard/teams" },
  { label: "PR Review", icon: GitPullRequest, href: "/dashboard/pr-review" },
];

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white p-5 lg:block">
        <Logo href="/dashboard" />
        <nav className="mt-10 grid gap-1">
          {navItems.map((item) => (
            <Link
              className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-600 transition hover:bg-secondary hover:text-slate-950"
              key={item.label}
              href={item.href}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === "Teams" && <TeamsNavBadge />}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="lg:hidden">
              <Logo href="/dashboard" />
            </div>
            <div className="hidden lg:block">
              <HeaderClient email={user.email || ""} />
            </div>
            <div className="flex items-center gap-2">
              <HeaderActions />
              <form action={signOutAction}>
                <Button variant="outline">Sign out</Button>
              </form>
            </div>
          </div>
        </header>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );
}
