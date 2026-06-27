import type { AnalysisIssue, IssueCategory, IssueSeverity } from "@/lib/types";

const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 10,
  high: 5,
  medium: 3,
  low: 1,
  info: 0.5
};

const CATEGORY_MAX: Record<IssueCategory, number> = {
  security: 100,
  performance: 100,
  maintainability: 100,
  complexity: 100,
  duplication: 100,
  code_style: 100,
  potential_bug: 100
};

const MAX_FILE_SCORE = 1000;

export function calculateScores(
  issues: AnalysisIssue[],
  totalFiles: number
): {
  score: number;
  security_score: number;
  performance_score: number;
  maintainability_score: number;
  categoryScores: Record<string, number>;
} {
  const categoryIssues: Partial<Record<IssueCategory, AnalysisIssue[]>> = {};
  for (const issue of issues) {
    if (!categoryIssues[issue.category]) categoryIssues[issue.category] = [];
    categoryIssues[issue.category]!.push(issue);
  }

  const categoryScores: Record<string, number> = {};
  for (const [category, catIssues] of Object.entries(categoryIssues)) {
    const max = CATEGORY_MAX[category as IssueCategory] || 100;
    const penalty = catIssues!.reduce((sum, iss) => sum + SEVERITY_WEIGHTS[iss.severity], 0);
    categoryScores[category] = Math.max(0, Math.round(max - penalty));
  }

  const securityScore = categoryScores.security ?? 100;
  const performanceScore = categoryScores.performance ?? 100;
  const maintainabilityScore = Math.min(
    100,
    Math.round(
      ((categoryScores.maintainability ?? 100) +
        (categoryScores.complexity ?? 100) +
        (categoryScores.duplication ?? 100) +
        (categoryScores.code_style ?? 100)) / 4
    )
  );

  const fileQualityScore = totalFiles > 0
    ? Math.min(100, Math.round((issues.length / totalFiles) * 10))
    : 100;

  const overall = Math.round(
    (securityScore * 0.3 +
      performanceScore * 0.2 +
      maintainabilityScore * 0.2 +
      fileQualityScore * 0.1 +
      Math.max(0, 100 - issues.length * 0.5)) / 1.0
  );

  return {
    score: Math.max(0, Math.min(100, overall)),
    security_score: securityScore,
    performance_score: performanceScore,
    maintainability_score: maintainabilityScore,
    categoryScores
  };
}

export function generateSummary(issues: AnalysisIssue[], scores: {
  score: number;
  security_score: number;
  performance_score: number;
  maintainability_score: number;
}): string {
  const total = issues.length;
  const bySeverity = groupBy(issues, "severity");
  const byCategory = groupBy(issues, "category");

  const parts: string[] = [];

  if (total === 0) {
    return "No issues found. The codebase looks clean!";
  }

  parts.push(`Found ${total} issue${total !== 1 ? "s" : ""}`);

  if (bySeverity.critical?.length) parts.push(`${bySeverity.critical.length} critical`);
  if (bySeverity.high?.length) parts.push(`${bySeverity.high.length} high`);
  if (bySeverity.medium?.length) parts.push(`${bySeverity.medium.length} medium`);

  if (scores.security_score < 80) parts.push(`security score: ${scores.security_score}/100`);
  if (scores.performance_score < 80) parts.push(`performance: ${scores.performance_score}/100`);

  if (parts.length > 1) {
    const last = parts.pop();
    return `${parts.join(", ")} and ${last}. Overall score: ${scores.score}/100.`;
  }

  return `${parts[0]}. Overall score: ${scores.score}/100.`;
}

function groupBy<T extends Record<string, any>>(arr: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}
