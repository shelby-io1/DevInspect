import type { AnalysisIssue } from "@/lib/types";
import { MAINTAINABILITY_RULES, POTENTIAL_BUG_RULES, ALL_RULES } from "./rules";

const FUNCTION_PATTERN = /(?:function\s+\w*\s*\(|=>\s*\{|\w+\s*=\s*(?:async\s*)?\(|class\s+\w+)/g;
const NESTING_KEYWORDS = /\b(?:if|for|while|switch|catch|with)\s*\(/g;
const TODO_PATTERN = /\b(?:TODO|FIXME|HACK|XXX)\b/g;
const MAGIC_NUMBER = /\b[0-9]{4,}\b(?!\s*[.:%])/g;
const CONDITION_COMPLEXITY = /&&|\|\|/g;
const PARAM_PATTERN = /function\s+\w*\s*\(([^)]*)\)/g;

export function analyzeComplexity(content: string, filename: string): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  const lines = content.split("\n");
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!["ts", "tsx", "js", "jsx", "py", "rb", "go", "rs", "java", "kt", "php", "cs"].includes(ext || "")) {
    return issues;
  }

  const functions: { name: string; startLine: number; body: string }[] = [];

  FUNCTION_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  const functionStarts: number[] = [];

  while ((match = FUNCTION_PATTERN.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split("\n").length;
    functionStarts.push(lineNum);
  }

  for (let i = 0; i < functionStarts.length; i++) {
    const start = functionStarts[i];
    const end = i + 1 < functionStarts.length ? functionStarts[i + 1] : lines.length + 1;
    const body = lines.slice(start - 1, end - 1).join("\n");
    const bodyLineCount = end - start;

    if (bodyLineCount > 50) {
      const funcName = lines[start - 1]?.trim().substring(0, 60) || "anonymous";
      const rule = MAINTAINABILITY_RULES.find((r) => r.id === "long-function")!;
      issues.push({
        rule_id: "long-function",
        severity: rule.severity,
        category: rule.category,
        file_path: filename,
        line_start: start,
        line_end: end - 1,
        message: `Function (${funcName}) is ${bodyLineCount} lines long (limit: 50).`,
        recommendation: rule.recommendation,
        code_snippet: lines[start - 1]?.trim() || null
      });
    }

    const paramMatch = lines[start - 1]?.match(PARAM_PATTERN);
    if (paramMatch) {
      const params = paramMatch[0].match(/\w+/g) || [];
      const paramCount = params.length - 1;
      if (paramCount > 5) {
        const rule = MAINTAINABILITY_RULES.find((r) => r.id === "too-many-parameters")!;
        issues.push({
          rule_id: "too-many-parameters",
          severity: rule.severity,
          category: rule.category,
          file_path: filename,
          line_start: start,
          line_end: start,
          message: `Function has ${paramCount} parameters (limit: 5).`,
          recommendation: rule.recommendation,
          code_snippet: lines[start - 1]?.trim() || null
        });
      }
    }

    const nestingDepth = measureNestingDepth(body);
    if (nestingDepth > 4) {
      const rule = MAINTAINABILITY_RULES.find((r) => r.id === "deep-nesting")!;
      issues.push({
        rule_id: "deep-nesting",
        severity: rule.severity,
        category: rule.category,
        file_path: filename,
        line_start: start,
        line_end: end - 1,
        message: `Function has nesting depth of ${nestingDepth} (limit: 4).`,
        recommendation: rule.recommendation,
        code_snippet: lines[start - 1]?.trim() || null
      });
    }

    const conditionCount = (body.match(CONDITION_COMPLEXITY) || []).length;
    if (conditionCount > 6) {
      const rule = MAINTAINABILITY_RULES.find((r) => r.id === "complex-condition")!;
      issues.push({
        rule_id: "complex-condition",
        severity: rule.severity,
        category: rule.category,
        file_path: filename,
        line_start: start,
        line_end: end - 1,
        message: `Complex condition with ${conditionCount} operators.`,
        recommendation: rule.recommendation,
        code_snippet: lines[start - 1]?.trim() || null
      });
    }
  }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    if (TODO_PATTERN.test(line)) {
      const rule = MAINTAINABILITY_RULES.find((r) => r.id === "todo-comment")!;
      issues.push({
        rule_id: "todo-comment",
        severity: rule.severity,
        category: rule.category,
        file_path: filename,
        line_start: lineNum,
        line_end: lineNum,
        message: `TODO/FIXME comment found: ${line.trim().substring(0, 80)}`,
        recommendation: rule.recommendation,
        code_snippet: line.trim()
      });
    }

    if (MAGIC_NUMBER.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("#") && !line.trim().startsWith("/*")) {
      MAGIC_NUMBER.lastIndex = 0;
      if ((line.match(MAGIC_NUMBER) || []).length > 0) {
        MAGIC_NUMBER.lastIndex = 0;
        const numbers = line.match(MAGIC_NUMBER);
        if (numbers && numbers.length <= 3 && !line.includes("const") && !line.includes("let ") && !line.includes("var ")) {
        }
      }
    }
  });

  return issues;
}

function measureNestingDepth(body: string): number {
  let depth = 0;
  let maxDepth = 0;

  for (const ch of body) {
    if (ch === "{" || ch === "(" || ch === "[") {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (ch === "}" || ch === ")" || ch === "]") {
      depth--;
    }
  }

  return maxDepth;
}

export function detectDuplicates(content: string, filename: string, allFiles: { path: string; content: string }[]): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  const lines = content.split("\n");

  const blocks: { hash: string; startLine: number; text: string }[] = [];
  const MIN_BLOCK_LINES = 6;

  for (let i = 0; i <= lines.length - MIN_BLOCK_LINES; i++) {
    const block = lines.slice(i, i + MIN_BLOCK_LINES).join("\n");
    const normalized = block.replace(/\s+/g, " ").replace(/\b\w+\b/g, "").trim();
    if (normalized.length > 20) {
      blocks.push({ hash: normalized, startLine: i + 1, text: block });
    }
  }

  for (const otherFile of allFiles) {
    if (otherFile.path === filename) continue;
    const otherLines = otherFile.content.split("\n");

    for (let i = 0; i <= otherLines.length - MIN_BLOCK_LINES; i++) {
      const otherBlock = otherLines.slice(i, i + MIN_BLOCK_LINES).join("\n");
      const otherNormalized = otherBlock.replace(/\s+/g, " ").replace(/\b\w+\b/g, "").trim();

      for (const block of blocks) {
        if (block.hash === otherNormalized && block.text.trim() === otherBlock.trim()) {
          const rule = MAINTAINABILITY_RULES.find((r) => r.id === "duplicate-code")!;
          if (!issues.some((iss) => iss.file_path === filename && iss.rule_id === "duplicate-code" && iss.line_start === block.startLine)) {
            issues.push({
              rule_id: "duplicate-code",
              severity: rule.severity,
              category: rule.category,
              file_path: filename,
              line_start: block.startLine,
              line_end: block.startLine + MIN_BLOCK_LINES - 1,
              message: `Duplicate code matches ${otherFile.path}:${i + 1}.`,
              recommendation: rule.recommendation,
              code_snippet: block.text.substring(0, 200)
            });
          }
          break;
        }
      }
    }
  }

  return issues;
}
