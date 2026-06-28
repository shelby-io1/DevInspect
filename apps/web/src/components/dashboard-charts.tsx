"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/charts";

interface AnalysisPoint {
  total_issues: number | null;
  score: number | null;
  created_at: string;
  repository_id: string;
}

export function DashboardCharts({ analyses }: { analyses: AnalysisPoint[] }) {
  const issuesOverTime = useMemo(() => {
    const byDate: Record<string, number> = {};
    analyses.forEach((a) => {
      const day = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDate[day] = (byDate[day] || 0) + (a.total_issues || 0);
    });
    return Object.entries(byDate).slice(-10).map(([label, value]) => ({ label, value, color: "#3b82f6" }));
  }, [analyses]);

  const scoreTrend = useMemo(() => {
    const byDate: Record<string, number[]> = {};
    analyses.forEach((a) => {
      if (a.score === null) return;
      const day = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(a.score);
    });
    return Object.entries(byDate).slice(-10).map(([label, scores]) => ({
      label,
      value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      color: "#10b981",
    }));
  }, [analyses]);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <BarChart data={issuesOverTime} title="Issues Over Time" height={180} />
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <BarChart data={scoreTrend} title="Average Score Trend" height={180} />
      </div>
    </div>
  );
}
