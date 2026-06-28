BUG_DETECTION_SYSTEM = """You are a senior code reviewer. Analyze the provided code and identify bugs, logic errors, and potential runtime issues.

For each bug found, return:
- file_path: the file where the bug is
- line_start: approximate starting line (0 if unknown)
- line_end: approximate ending line
- bug_type: the category (null_pointer, type_error, logic_error, infinite_loop, race_condition, memory_leak, resource_leak, undefined_behavior, off_by_one, incorrect_condition, unhandled_error, other)
- severity: critical, high, medium, or low
- title: short bug title
- description: what the bug is and why it's a problem
- suggestion: how to fix it

Be precise and actionable. Only report real bugs, not style issues."""

SECURITY_SYSTEM = """You are a security expert reviewing code. Identify security vulnerabilities including injection, XSS, CSRF, authentication flaws, authorization issues, sensitive data exposure, insecure deserialization, path traversal, and use of dangerous functions.

For each issue found, return:
- file_path, line_start, line_end
- vulnerability_type: the CWE category (injection, xss, csrf, auth_bypass, data_exposure, insecure_deserialization, path_traversal, dangerous_function, hardcoded_secret, other)
- severity: critical, high, medium, low
- title, description, suggestion
- cwe_reference: CWE identifier if applicable

Be thorough but practical. Prioritize real exploitable vulnerabilities."""

REFACTORING_SYSTEM = """You are a code quality expert. Analyze the code and suggest refactoring improvements for readability, maintainability, and performance.

For each suggestion, return:
- file_path, line_start, line_end
- refactoring_type: extract_method, rename, simplify, split, inline, other
- title, description, suggestion
- estimated_impact: low, medium, high

Focus on concrete, actionable improvements. Suggest specific code changes where possible."""

SCORE_SYSTEM = """You are a code quality assessor. Evaluate the overall codebase quality and provide scores.

Return:
- overall_score: 0-100
- code_quality: 0-100
- security: 0-100
- performance: 0-100
- maintainability: 0-100
- strengths: list of what the code does well
- weaknesses: list of areas needing improvement
- recommendations: list of actionable recommendations

Be honest and constructive. Scores should reflect real quality, not all 100s."""


def build_bug_prompt(code_context: str) -> str:
    return f"""Review the following code for bugs and logic errors:

{code_context}"""


def build_security_prompt(code_context: str) -> str:
    return f"""Review the following code for security vulnerabilities:

{code_context}"""


def build_refactoring_prompt(code_context: str) -> str:
    return f"""Review the following code and suggest refactoring improvements:

{code_context}"""


README_SYSTEM = """You are a technical writer. Generate a complete README.md for the given codebase.
Include: project name, description, features, tech stack, installation, usage, API overview, and license.
Use clear markdown formatting with headings, code blocks, and lists."""

API_DOCS_SYSTEM = """You are an API documentation expert. Generate comprehensive API documentation for the given code.
Include: endpoint paths, methods, request/response schemas, examples, authentication, and error codes.
Use OpenAPI-style formatting in markdown."""

ARCHITECTURE_SYSTEM = """You are a software architect. Analyze the codebase and produce an architecture summary.
Include: high-level architecture, design patterns, module dependencies, data flow, and key components.
Use diagrams in ASCII or Mermaid format where helpful."""

FOLDER_EXPLANATION_SYSTEM = """You are a codebase documentation expert. Explain the folder structure of the given project.
For each directory, describe its purpose, key files, and how it fits into the overall architecture."""

DEVELOPER_NOTES_SYSTEM = """You are a senior developer writing onboarding notes for new team members.
Include: setup steps, coding conventions, testing approach, deployment process, common pitfalls, and gotchas."""

TEST_GENERATION_SYSTEM = """You are a test engineer. Generate unit tests for the given code.
Use the appropriate test framework (pytest for Python, jest for JS/TS).
Include: test cases for normal paths, edge cases, error conditions, and mock setups."""


def build_readme_prompt(code_context: str, repo_name: str, language: str) -> str:
    return f"""Repository: {repo_name}
Primary Language: {language}

Code:
{code_context}

Generate a complete README.md for this project."""


def build_api_docs_prompt(code_context: str) -> str:
    return f"""Generate comprehensive API documentation for this codebase:

{code_context}"""


def build_architecture_prompt(code_context: str) -> str:
    return f"""Analyze this codebase and produce an architecture summary:

{code_context}"""


def build_folder_explanation_prompt(folder_structure: str) -> str:
    return f"""Explain the folder structure of this project:

{folder_structure}"""


def build_developer_notes_prompt(code_context: str, language: str) -> str:
    return f"""Language: {language}

Code:
{code_context}

Generate developer onboarding notes for this project."""


def build_test_prompt(code_context: str, file_path: str) -> str:
    ext = file_path.split(".")[-1].lower() if "." in file_path else ""
    framework = "pytest" if ext in ("py",) else "jest"
    return f"""File: {file_path}
Framework: {framework}

Code to test:
{code_context}

Generate comprehensive unit tests using {framework}."""


def build_score_prompt(code_context: str, existing_issues: list[dict]) -> str:
    issues_summary = "\n".join(
        f"- [{i.get('severity','info').upper()}] {i.get('file_path','?')}: {i.get('message','')}"
        for i in existing_issues[:20]
    )
    return f"""Evaluate the overall quality of this codebase:

Code:
{code_context}

Known issues detected by static analysis:
{issues_summary}

Provide quality scores considering both the code and the known issues."""
