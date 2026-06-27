import type { AnalysisIssue } from "@/lib/types";
import { SECURITY_RULES, PERFORMANCE_RULES } from "./rules";

const SECRET_PATTERNS = [
  { regex: /(?:api[_-]?key|apikey|secret|token|password|pwd|auth|credential)\s*[:=]\s*['"][^'"]{8,}['"]/gi, ruleId: "hardcoded-secret" },
  { regex: /(?:sk-[a-zA-Z0-9]{20,}|pk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|gho_[a-zA-Z0-9]{36,})/g, ruleId: "hardcoded-secret" },
  { regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, ruleId: "hardcoded-secret" }
];

const SQL_INJECTION_PATTERNS = [
  { regex: /\b(?:query|execute|run)\s*\(\s*[`'"]\s*SELECT/i, ruleId: "sql-injection" },
  { regex: /\$\{.*\}\s*\+\s*['"`]\s*(?:SELECT|INSERT|UPDATE|DELETE)/i, ruleId: "sql-injection" },
  { regex: /['"`]\s*\+\s*(?:req\.query|req\.body|params|payload)/i, ruleId: "sql-injection" }
];

const EVAL_PATTERNS = [
  { regex: /\beval\s*\(/g, ruleId: "eval-usage" },
  { regex: /\bnew\s+Function\s*\(/g, ruleId: "eval-usage" },
  { regex: /\bsetTimeout\s*\(\s*['"`]/g, ruleId: "eval-usage" }
];

const COMMAND_INJECTION_PATTERNS = [
  { regex: /\b(?:exec|execSync|spawn|execFile)\s*\(\s*[`'"]/g, ruleId: "command-injection" },
  { regex: /\bchild_process\s*\.\s*(?:exec|execSync|spawn|execFile)\s*\(/g, ruleId: "command-injection" }
];

const INNER_HTML_PATTERNS = [
  { regex: /\.innerHTML\s*=/g, ruleId: "dangerous-innerhtml" },
  { regex: /\.insertAdjacentHTML\s*\(/g, ruleId: "dangerous-innerhtml" }
];

const PROTOTYPE_PATTERNS = [
  { regex: /__proto__/g, ruleId: "unsafe-prototype-access" },
  { regex: /\.prototype\s*\.\s*/g, ruleId: "unsafe-prototype-access" }
];

const LARGE_IMPORT_PATTERNS = [
  { regex: /import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|underscore|moment|axios)['"]/g, ruleId: "large-bundle-import" },
  { regex: /import\s+\w+\s+from\s+['"](?:lodash|underscore|moment)['"]/g, ruleId: "large-bundle-import" }
];

const SYNC_OP_PATTERNS = [
  { regex: /\b(?:readFileSync|writeFileSync|readdirSync|mkdirSync|statSync|existsSync)\s*\(/g, ruleId: "sync-blocking-operation" },
  { regex: /\b(?:execSync|spawnSync)\s*\(/g, ruleId: "sync-blocking-operation" }
];

const CONSOLE_PATTERNS = [
  { regex: /\bconsole\.(?:log|debug|info)\s*\(/g, ruleId: "console-log-in-production" }
];

const DEBUGGER_PATTERNS = [
  { regex: /\bdebugger\s*;/g, ruleId: "debugger-statement" }
];

const EMPTY_CATCH_PATTERNS = [
  { regex: /catch\s*\([^)]*\)\s*\{\s*\}/g, ruleId: "empty-catch-block" }
];

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

function extractSnippet(content: string, index: number, length: number): string {
  const start = Math.max(0, content.lastIndexOf("\n", index));
  const end = Math.min(content.length, content.indexOf("\n", index + length) + 1);
  return content.substring(start, end).trim();
}

function scanPatterns(
  content: string,
  filename: string,
  patterns: { regex: RegExp; ruleId: string }[],
  ruleMap: typeof SECURITY_RULES
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  const lines = content.split("\n");

  for (const { regex, ruleId } of patterns) {
    const rule = ruleMap.find((r) => r.id === ruleId);
    if (!rule) continue;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const lineNum = getLineNumber(content, match.index);
      issues.push({
        rule_id: ruleId,
        severity: rule.severity,
        category: rule.category,
        file_path: filename,
        line_start: lineNum,
        line_end: lineNum,
        message: `${rule.title}: ${rule.description}`,
        recommendation: rule.recommendation,
        code_snippet: lines[lineNum - 1]?.trim() || null
      });
    }
  }

  return issues;
}

export function scanSecurity(content: string, filename: string): AnalysisIssue[] {
  return [
    ...scanPatterns(content, filename, SECRET_PATTERNS, SECURITY_RULES),
    ...scanPatterns(content, filename, SQL_INJECTION_PATTERNS, SECURITY_RULES),
    ...scanPatterns(content, filename, EVAL_PATTERNS, SECURITY_RULES),
    ...scanPatterns(content, filename, COMMAND_INJECTION_PATTERNS, SECURITY_RULES),
    ...scanPatterns(content, filename, INNER_HTML_PATTERNS, SECURITY_RULES),
    ...scanPatterns(content, filename, PROTOTYPE_PATTERNS, SECURITY_RULES)
  ];
}

export function scanPerformance(content: string, filename: string): AnalysisIssue[] {
  return [
    ...scanPatterns(content, filename, LARGE_IMPORT_PATTERNS, PERFORMANCE_RULES),
    ...scanPatterns(content, filename, SYNC_OP_PATTERNS, PERFORMANCE_RULES)
  ];
}

export function scanPotentialBugs(content: string, filename: string): AnalysisIssue[] {
  return [
    ...scanPatterns(content, filename, CONSOLE_PATTERNS, []),
    ...scanPatterns(content, filename, DEBUGGER_PATTERNS, []),
    ...scanPatterns(content, filename, EMPTY_CATCH_PATTERNS, [])
  ];
}
