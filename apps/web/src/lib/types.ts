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
