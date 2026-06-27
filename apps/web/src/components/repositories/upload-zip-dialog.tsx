"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function UploadZipDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/repositories/upload-zip", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload ZIP file");
        return;
      }

      setOpen(false);
      setFile(null);
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".zip")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only .zip files are accepted");
    }
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UploadCloud className="h-4 w-4" />
        Upload ZIP
      </Button>

      <Dialog
        open={open}
        onClose={() => { setOpen(false); setError(null); setFile(null); }}
        title="Upload ZIP"
        description="Upload a ZIP file containing your repository code."
      >
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-primary"
          >
            <UploadCloud className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">
              {file ? file.name : "Drop a ZIP file here or click to browse"}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.name.endsWith(".zip")) {
                    setFile(f);
                    setError(null);
                  } else {
                    setError("Only .zip files are accepted");
                  }
                }
              }}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(null); setFile(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
