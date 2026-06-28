"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportData {
  analysis: Record<string, unknown>;
  issues: Record<string, unknown>[];
  aiInsights?: Record<string, unknown>[];
}

export function ExportButton({ data, filename = "analysis-report" }: { data: ExportData; filename?: string }) {
  const [open, setOpen] = useState(false);

  function downloadCSV() {
    const headers = ["rule_id", "severity", "category", "file_path", "line_start", "line_end", "message", "recommendation"];
    const rows = data.issues.map((i) =>
      headers.map((h) => {
        const val = i[h];
        const s = val === null || val === undefined ? "" : String(val);
        return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    download(csv, `${filename}.csv`, "text/csv");
    setOpen(false);
  }

  function downloadJSON() {
    const blob = JSON.stringify(data, null, 2);
    download(blob, `${filename}.json`, "application/json");
    setOpen(false);
  }

  function download(content: string, name: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-300 transition"
      >
        <Download className="h-4 w-4" />
        Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-white py-1 shadow-lg">
            <button onClick={downloadCSV} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">
              Download CSV
            </button>
            <button onClick={downloadJSON} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">
              Download JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
