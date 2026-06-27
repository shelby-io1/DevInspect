import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r bg-white p-10 lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div>
          <p className="max-w-md text-3xl font-semibold leading-tight text-slate-950">
            AI-powered code review for modern teams.
          </p>
          <p className="mt-4 max-w-md text-slate-600">
            Sign in to manage repositories, review findings, and monitor quality
            trends as DevInspect grows phase by phase.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
