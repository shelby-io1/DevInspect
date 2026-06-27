"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  title: string;
  description: string;
  mode: "login" | "signup";
  submitLabel: string;
  footerLabel: string;
  footerHref: string;
  footerCta: string;
};

export function AuthForm({
  title,
  description,
  mode,
  submitLabel,
  footerLabel,
  footerHref,
  footerCta
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          router.push("/dashboard");
        } else {
          setSuccess("Account created! Check your email for a confirmation link before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [email, password, mode, router, supabase]);

  return (
    <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </label>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <Button disabled={loading} type="submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Please wait..." : submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {footerLabel}{" "}
        <Link className="font-medium text-primary hover:underline" href={footerHref}>
          {footerCta}
        </Link>
      </p>
    </div>
  );
}
