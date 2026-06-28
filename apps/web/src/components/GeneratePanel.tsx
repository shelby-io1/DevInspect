"use client";

import { useState } from "react";
import {
  BookOpenText, FileText, Building2, FolderTree, StickyNote, Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface GeneratePanelProps {
  analysisId: string;
  repositoryId: string;
  repoName?: string;
  language?: string;
  files?: { path: string; content: string }[];
  folderStructure?: string;
}

const GENERATION_TYPES = [
  { key: "readme", label: "README", icon: BookOpenText, description: "Generate a project README.md" },
  { key: "api-docs", label: "API Docs", icon: FileText, description: "Generate API documentation" },
  { key: "architecture", label: "Architecture", icon: Building2, description: "Generate architecture summary" },
  { key: "folder-explanation", label: "Folder Structure", icon: FolderTree, description: "Explain the folder structure" },
  { key: "developer-notes", label: "Dev Notes", icon: StickyNote, description: "Generate developer onboarding notes" },
  { key: "tests", label: "Unit Tests", icon: Beaker, description: "Generate unit tests for a file" },
] as const;

function downloadContent(content: string, filename: string, format: string = "markdown") {
  const ext = format === "json" ? "json" : "md";
  const mime = format === "json" ? "application/json" : "text/markdown";
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GeneratePanel({
  analysisId, repositoryId, repoName, language, files, folderStructure
}: GeneratePanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; data: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(type: string) {
    setLoading(type);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        docType: type,
        analysisId,
        repositoryId,
        repoName: repoName || "my-project",
        language: language || "Unknown",
      };
      if (files) body.files = files;
      if (folderStructure) body.folderStructure = folderStructure;

      const res = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180000),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({ type, data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(null);
    }
  }

  const displayContent = result?.data?.content || (result?.data && typeof result.data === "object" ? JSON.stringify(result.data, null, 2) : "");

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-slate-600">AI Generation</h2>
        <span className="text-xs text-slate-400">— Generate documentation, tests, and notes from your codebase</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GENERATION_TYPES.map(({ key, label, icon: Icon, description }) => (
          <button
            key={key}
            disabled={loading !== null}
            onClick={() => handleGenerate(key)}
            className="flex items-start gap-3 rounded-lg border bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {loading === key ? "Generating..." : label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 capitalize">
              Generated {result.type.replace("-", " ")}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(displayContent)}
              >
                Copy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => downloadContent(
                  displayContent,
                  `${result.type}-${new Date().toISOString().split("T")[0]}`,
                  result.data?.format || "markdown"
                )}
              >
                Download
              </Button>
            </div>
          </div>

          {result.data?.test_code ? (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Framework: {result.data.framework} &middot; Test file: {result.data.test_file_path || `${result.data.file_path.replace(/\.\w+$/, "")}_test.py`}
              </p>
              <pre className="overflow-x-auto rounded bg-slate-950 p-4 text-xs text-slate-200"><code>{result.data.test_code}</code></pre>
            </div>
          ) : (
            <pre className="overflow-x-auto rounded bg-slate-50 p-4 text-xs text-slate-800 border">{displayContent}</pre>
          )}
        </div>
      )}
    </div>
  );
}
