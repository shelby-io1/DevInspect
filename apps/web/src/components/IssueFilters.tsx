"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import type { IssueSeverity, IssueCategory } from "@/lib/types";

interface Issue {
  id: string;
  rule_id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  file_path: string;
  message: string;
  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;
  recommendation: string | null;
}

interface IssueFiltersProps {
  issues: Issue[];
  children: (filtered: Issue[]) => React.ReactNode;
}

const SEVERITIES: IssueSeverity[] = ["critical", "high", "medium", "low", "info"];
const CATEGORIES: IssueCategory[] = ["security", "performance", "maintainability", "complexity", "duplication", "code_style", "potential_bug"];

export function IssueFilters({ issues, children }: IssueFiltersProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "all">("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const tools = useMemo(() => {
    const t = new Set<string>();
    issues.forEach((i) => {
      const prefix = i.rule_id.split("-")[0];
      if (prefix) t.add(prefix);
    });
    return Array.from(t).sort();
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
      if (toolFilter !== "all" && !issue.rule_id.startsWith(toolFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!issue.message.toLowerCase().includes(q) && !issue.file_path.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [issues, severityFilter, categoryFilter, toolFilter, search]);

  const activeFilters = [severityFilter, categoryFilter, toolFilter].filter((f) => f !== "all").length + (search ? 1 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition ${
            activeFilters > 0 ? "border-blue-300 bg-blue-50 text-blue-700" : "bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-3 rounded-lg border bg-slate-50 p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase text-slate-500">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as IssueSeverity | "all")}
              className="rounded border bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              <option value="all">All severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase text-slate-500">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as IssueCategory | "all")}
              className="rounded border bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          {tools.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase text-slate-500">Tool</label>
              <select
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
                className="rounded border bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              >
                <option value="all">All tools</option>
                {tools.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={() => { setSeverityFilter("all"); setCategoryFilter("all"); setToolFilter("all"); setSearch(""); }}
              className="rounded-md border bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {children(filtered)}
    </div>
  );
}
