export type RepositorySource = "github" | "upload";
export type RepositoryStatus = "pending" | "importing" | "ready" | "error";

export interface Repository {
  id: string;
  user_id: string;
  name: string;
  full_name: string | null;
  url: string | null;
  description: string | null;
  language: string | null;
  default_branch: string;
  stars: number;
  source: RepositorySource;
  status: RepositoryStatus;
  metadata: Record<string, unknown>;
  score: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositoryFile {
  id: string;
  repository_id: string;
  path: string;
  content: string | null;
  language: string | null;
  size: number;
  created_at: string;
}

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "info";
export type IssueCategory = "security" | "performance" | "maintainability" | "complexity" | "duplication" | "code_style" | "potential_bug";
export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export interface AnalysisIssue {
  rule_id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  file_path: string;
  line_start: number | null;
  line_end: number | null;
  message: string;
  recommendation: string | null;
  code_snippet: string | null;
}

export interface AnalysisResult {
  id: string;
  repository_id: string;
  status: AnalysisStatus;
  score: number | null;
  security_score: number | null;
  performance_score: number | null;
  maintainability_score: number | null;
  total_issues: number;
  summary: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  issues: AnalysisIssue[];
}
