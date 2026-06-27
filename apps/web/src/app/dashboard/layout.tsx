import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, GitBranch, LayoutDashboard, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Repositories", icon: GitBranch, href: "/dashboard/repositories" }
];

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white p-5 lg:block">
        <Logo />
        <nav className="mt-10 grid gap-1">
          {navItems.map((item) => (
            <Link
              className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-600 transition hover:bg-secondary hover:text-slate-950"
              key={item.label}
              href={item.href}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button aria-label="Notifications" size="icon" variant="ghost">
                <Bell className="h-4 w-4" />
              </Button>
              <form action={signOutAction}>
                <Button variant="outline">Sign out</Button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
