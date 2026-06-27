"use client";

import { useState, useCallback } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteRepositoryButton({ repoId }: { repoId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this repository and all its files?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/repositories/${repoId}`, { method: "DELETE" });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  return (
    <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
    </Button>
  );
}
