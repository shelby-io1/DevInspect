import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="DevInspect home">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        DI
      </span>
      <span className="text-lg font-semibold text-slate-950">DevInspect</span>
    </Link>
  );
}
