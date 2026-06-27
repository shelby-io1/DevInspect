import type { AnalysisIssue, IssueCategory, IssueSeverity } from "@/lib/types";
import { scanSecurity, scanPerformance, scanPotentialBugs } from "./scanner";
import { analyzeComplexity, detectDuplicates } from "./complexity";
import { calculateScores, generateSummary } from "./scoring";
import type { RepositoryFile } from "@/lib/types";

const TEXT_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "mts", "cts",
  "py", "rb", "go", "rs", "java", "kt", "swift", "php", "cs", "scala",
  "c", "cpp", "h", "hpp", "mm",
  "html", "css", "scss", "less", "sass",
  "json", "yaml", "yml", "xml", "toml", "ini", "cfg",
  "md", "mdx", "sql", "graphql", "prisma",
  "sh", "bash", "zsh", "fish", "ps1", "bat",
  "dockerfile", "makefile", "terraform", "tf",
  "vue", "svelte", "astro",
  "env", "editorconfig", "gitignore"
]);

function isAnalyzeable(filename: string): boolean {
  const name = filename.toLowerCase();
  const ext = name.split(".").pop() || "";
  if (name === "dockerfile") return true;
  if (name === "makefile") return true;
  return TEXT_EXTENSIONS.has(ext);
}

function normalizeIssue(raw: AnalysisIssue): AnalysisIssue {
  return {
    rule_id: raw.rule_id,
    severity: raw.severity as IssueSeverity,
    category: raw.category as IssueCategory,
    file_path: raw.file_path,
    line_start: raw.line_start,
    line_end: raw.line_end,
    message: raw.message,
    recommendation: raw.recommendation,
    code_snippet: raw.code_snippet
  };
}

export interface AnalysisOutput {
  issues: AnalysisIssue[];
  score: number;
  security_score: number;
  performance_score: number;
  maintainability_score: number;
  summary: string;
}

export function analyzeRepository(files: RepositoryFile[]): AnalysisOutput {
  const allIssues: AnalysisIssue[] = [];
  const analyzeableFiles = files.filter((f) => f.content && isAnalyzeable(f.path));
  const fileContents = analyzeableFiles.map((f) => ({ path: f.path, content: f.content! }));

  for (const file of analyzeableFiles) {
    const content = file.content!;
    const path = file.path;

    const security = scanSecurity(content, path);
    const performance = scanPerformance(content, path);
    const bugs = scanPotentialBugs(content, path);
    const complexity = analyzeComplexity(content, path);

    for (const issue of [...security, ...performance, ...bugs, ...complexity]) {
      allIssues.push(normalizeIssue(issue));
    }
  }

  for (const file of fileContents) {
    const dups = detectDuplicates(file.content, file.path, fileContents);
    for (const issue of dups) {
      allIssues.push(normalizeIssue(issue));
    }
  }

  const scores = calculateScores(allIssues, analyzeableFiles.length);
  const summary = generateSummary(allIssues, scores);

  return {
    issues: allIssues,
    ...scores,
    summary
  };
}
