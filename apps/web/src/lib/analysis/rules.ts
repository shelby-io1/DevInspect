import type { IssueCategory, IssueSeverity } from "@/lib/types";

export interface AnalysisRule {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export const SECURITY_RULES: AnalysisRule[] = [
  {
    id: "hardcoded-secret",
    category: "security",
    severity: "critical",
    title: "Hardcoded secret detected",
    description: "A potential API key, password, token, or secret is hardcoded in the source code.",
    recommendation: "Move secrets to environment variables or a secure secrets manager."
  },
  {
    id: "sql-injection",
    category: "security",
    severity: "critical",
    title: "Potential SQL injection",
    description: "String interpolation or concatenation in SQL queries can lead to SQL injection attacks.",
    recommendation: "Use parameterized queries or an ORM to safely handle user input."
  },
  {
    id: "eval-usage",
    category: "security",
    severity: "high",
    title: "Dangerous eval() usage",
    description: "Using eval() or similar functions (Function(), setTimeout with string) can execute arbitrary code.",
    recommendation: "Avoid eval(). Use safer alternatives like JSON.parse() for JSON data."
  },
  {
    id: "command-injection",
    category: "security",
    severity: "high",
    title: "Potential command injection",
    description: "Shell command execution with unsanitized user input can lead to command injection.",
    recommendation: "Avoid shell execution with user input. Use safer APIs or sanitize input strictly."
  },
  {
    id: "dangerous-innerhtml",
    category: "security",
    severity: "high",
    title: "Dangerous innerHTML usage",
    description: "Setting innerHTML with unsanitized content can lead to XSS attacks.",
    recommendation: "Use textContent or sanitize HTML with a library like DOMPurify."
  },
  {
    id: "unsafe-prototype-access",
    category: "security",
    severity: "medium",
    title: "Unsafe prototype access",
    description: "Direct access to __proto__ or prototype properties can be exploited.",
    recommendation: "Avoid direct prototype manipulation. Use Object.create() or class syntax."
  }
];

export const PERFORMANCE_RULES: AnalysisRule[] = [
  {
    id: "large-bundle-import",
    category: "performance",
    severity: "medium",
    title: "Large bundle import",
    description: "Importing an entire library when only specific parts are needed increases bundle size.",
    recommendation: "Use named imports or dynamic imports to reduce bundle size."
  },
  {
    id: "sync-blocking-operation",
    category: "performance",
    severity: "medium",
    title: "Synchronous blocking operation",
    description: "Synchronous operations (readFileSync, etc.) block the event loop.",
    recommendation: "Use async/await or Promise-based alternatives."
  },
  {
    id: "nested-loops",
    category: "performance",
    severity: "low",
    title: "Deeply nested loops",
    description: "Nested loops with O(n²) or higher complexity can cause performance issues with large datasets.",
    recommendation: "Consider using hash maps, early breaks, or restructuring the algorithm."
  },
  {
    id: "inefficient-regex",
    category: "performance",
    severity: "low",
    title: "Potentially inefficient regex",
    description: "Regular expression with nested quantifiers or backtracking may cause ReDoS.",
    recommendation: "Simplify the regex or add boundaries to limit backtracking."
  },
  {
    id: "missing-memoization",
    category: "performance",
    severity: "low",
    title: "Missing memoization in component",
    description: "Expensive computations in render functions run on every render.",
    recommendation: "Use useMemo or useCallback to memoize expensive computations."
  }
];

export const MAINTAINABILITY_RULES: AnalysisRule[] = [
  {
    id: "long-function",
    category: "maintainability",
    severity: "medium",
    title: "Excessively long function",
    description: "Functions with too many lines are hard to understand and maintain.",
    recommendation: "Break the function into smaller, focused functions."
  },
  {
    id: "too-many-parameters",
    category: "maintainability",
    severity: "medium",
    title: "Too many function parameters",
    description: "Functions with many parameters are hard to use and test.",
    recommendation: "Use an options object or refactor into smaller functions."
  },
  {
    id: "deep-nesting",
    category: "maintainability",
    severity: "medium",
    title: "Excessive nesting depth",
    description: "Deeply nested conditionals or loops reduce code readability.",
    recommendation: "Use early returns, guard clauses, or extract nested logic."
  },
  {
    id: "magic-number",
    category: "maintainability",
    severity: "low",
    title: "Magic number used",
    description: "Unexplained numeric literals make code harder to understand.",
    recommendation: "Assign magic numbers to named constants."
  },
  {
    id: "todo-comment",
    category: "maintainability",
    severity: "info",
    title: "TODO or FIXME comment",
    description: "Unresolved TODO or FIXME comments indicate incomplete work.",
    recommendation: "Address the TODO or remove the comment if no longer relevant."
  },
  {
    id: "duplicate-code",
    category: "duplication",
    severity: "medium",
    title: "Duplicate code block",
    description: "Similar or identical code blocks appear in multiple places.",
    recommendation: "Extract duplicated logic into a shared function or module."
  },
  {
    id: "complex-condition",
    category: "complexity",
    severity: "medium",
    title: "Overly complex condition",
    description: "Boolean expressions with too many operands reduce readability.",
    recommendation: "Extract the condition into a well-named variable or function."
  }
];

export const POTENTIAL_BUG_RULES: AnalysisRule[] = [
  {
    id: "console-log-in-production",
    category: "potential_bug",
    severity: "info",
    title: "Console statement left in code",
    description: "console.log statements may leak sensitive info and degrade performance.",
    recommendation: "Remove console statements before deploying to production."
  },
  {
    id: "debugger-statement",
    category: "potential_bug",
    severity: "high",
    title: "Debugger statement in code",
    description: "A debugger statement will halt execution in development and may cause issues.",
    recommendation: "Remove debugger statements before deploying."
  },
  {
    id: "empty-catch-block",
    category: "potential_bug",
    severity: "medium",
    title: "Empty catch block",
    description: "Empty catch blocks swallow errors and make debugging difficult.",
    recommendation: "Log the error or handle it appropriately in the catch block."
  }
];

export const ALL_RULES: AnalysisRule[] = [
  ...SECURITY_RULES,
  ...PERFORMANCE_RULES,
  ...MAINTAINABILITY_RULES,
  ...POTENTIAL_BUG_RULES
];

export const RULE_MAP = new Map(ALL_RULES.map((r) => [r.id, r]));
