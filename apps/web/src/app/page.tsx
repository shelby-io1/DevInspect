import Link from "next/link";
import { ArrowRight, CheckCircle2, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const features = [
  "Static analysis plus AI review",
  "Security, performance, and maintainability scoring",
  "Reports, generated docs, and future PR reviews"
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Start review <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered code review for modern teams
          </div>
          <h1 className="text-5xl font-semibold tracking-normal text-slate-950 sm:text-6xl">
            DevInspect
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Analyze repositories, surface security and quality issues, and turn review
            findings into clear engineering action from a focused SaaS dashboard.
          </p>

          <ul className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-slate-950 p-5 text-white shadow-2xl shadow-blue-100">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">Repository score</p>
              <p className="text-3xl font-semibold">87</p>
            </div>
            <ShieldCheck className="h-9 w-9 text-sky-300" />
          </div>
          <div className="grid gap-3">
            {[
              ["Security", "92", "bg-emerald-400"],
              ["Performance", "81", "bg-sky-400"],
              ["Maintainability", "88", "bg-blue-400"]
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-md bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-slate-300">{value}/100</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitBranch className="h-4 w-4 text-sky-300" />
              web-platform
            </div>
            <p className="mt-2 text-sm text-slate-400">
              14 issues found across security, duplication, and missing tests.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
