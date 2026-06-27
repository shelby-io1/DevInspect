"use client";

import { useState, useCallback } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImportGitHubDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/repositories/import-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import repository");
        return;
      }

      setOpen(false);
      setUrl("");
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <GitBranch className="h-4 w-4" />
        Import GitHub URL
      </Button>

      <Dialog
        open={open}
        onClose={() => { setOpen(false); setError(null); setUrl(""); }}
        title="Import from GitHub"
        description="Paste a public GitHub repository URL to import its contents."
      >
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Repository URL
            <input
              className="h-11 rounded-md border px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(null); setUrl(""); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
