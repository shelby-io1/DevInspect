import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
