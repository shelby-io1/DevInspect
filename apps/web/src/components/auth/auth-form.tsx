"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthState } from "@/app/auth/actions";

type AuthFormProps = {
  title: string;
  description: string;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  footerLabel: string;
  footerHref: string;
  footerCta: string;
};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  footerLabel,
  footerHref,
  footerCta
}: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <form action={formAction} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="email"
            type="email"
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
            autoComplete="current-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </label>

        {state.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <Button disabled={isPending} type="submit">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
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
