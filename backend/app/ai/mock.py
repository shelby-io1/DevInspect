import json
import random
from typing import Optional

from .base import AIProvider


MOCK_BUGS_RESPONSE = {
    "summary": "Found 2 potential bugs in the codebase.",
    "bugs": [
        {
            "file_path": "test.py",
            "line_start": 1,
            "line_end": 1,
            "bug_type": "unused_import",
            "severity": "low",
            "title": "Unused import",
            "description": "The 'os' module is imported but never used.",
            "suggestion": "Remove the unused import to clean up the code."
        },
        {
            "file_path": "test.py",
            "line_start": 10,
            "line_end": 15,
            "bug_type": "error_handling",
            "severity": "medium",
            "title": "Missing error handling",
            "description": "The function does not handle potential exceptions.",
            "suggestion": "Wrap the code in a try-except block to handle errors gracefully."
        }
    ]
}

MOCK_SECURITY_RESPONSE = {
    "summary": "Found 1 security issue.",
    "risk_level": "medium",
    "issues": [
        {
            "file_path": "test.py",
            "line_start": 3,
            "line_end": 3,
            "vulnerability_type": "hardcoded_secret",
            "severity": "high",
            "title": "Hardcoded secret detected",
            "description": "A hardcoded API key or secret was found in the code.",
            "suggestion": "Move secrets to environment variables or a secrets manager.",
            "cwe_reference": "CWE-798"
        }
    ]
}

MOCK_REFACTOR_RESPONSE = {
    "summary": "Found 2 refactoring opportunities.",
    "suggestions": [
        {
            "file_path": "test.py",
            "line_start": 5,
            "line_end": 12,
            "refactoring_type": "extract_method",
            "title": "Extract repeated logic",
            "description": "Duplicate logic detected across multiple functions.",
            "suggestion": "Extract the common logic into a shared helper function.",
            "estimated_impact": "medium"
        },
        {
            "file_path": "test.py",
            "line_start": 1,
            "line_end": 3,
            "refactoring_type": "simplify",
            "title": "Simplify conditional",
            "description": "Nested conditionals make the code hard to follow.",
            "suggestion": "Use early returns to flatten the nesting.",
            "estimated_impact": "low"
        }
    ]
}

MOCK_CHAT_RESPONSE = """Based on the code in this repository, here's what I can tell you:

The repository contains a DevInspect application — an AI-powered code review tool. It includes:

1. **Frontend**: A Next.js 16 application with TypeScript and Tailwind CSS
2. **Backend**: A Python FastAPI server with static analysis tools (Ruff, Bandit, Semgrep, ESLint)
3. **AI Layer**: Integration with Ollama/Qwen3-Coder for AI-powered code analysis

The main entry point for the backend is `backend/app/main.py` which exposes analysis endpoints. The frontend routes are in `apps/web/src/app/`.

If you have a specific question about how a feature works, feel free to ask!"""

MOCK_PR_REVIEW_RESPONSE = {
    "summary": "Found 3 issues in this pull request.",
    "issues": [
        {
            "file": "src/main.py",
            "line_start": 10,
            "line_end": 15,
            "severity": "high",
            "type": "security",
            "title": "SQL Injection vulnerability",
            "description": "User input is concatenated directly into SQL query string.",
            "suggestion": "Use parameterized queries instead of string formatting."
        },
        {
            "file": "src/utils.py",
            "line_start": 25,
            "line_end": 25,
            "severity": "medium",
            "type": "bug",
            "title": "Unused variable",
            "description": "Variable 'temp' is assigned but never used.",
            "suggestion": "Remove the unused variable or use it."
        },
        {
            "file": "src/config.py",
            "line_start": 5,
            "line_end": 5,
            "severity": "low",
            "type": "code_style",
            "title": "Hardcoded value",
            "description": "Magic number 86400 should be a named constant.",
            "suggestion": "Define TIMEOUT = 86400 at the module level."
        }
    ],
    "approved": False,
    "suggestions": [
        "Fix SQL injection by using parameterized queries",
        "Remove unused variables",
        "Replace magic numbers with named constants"
    ]
}


MOCK_README_RESPONSE = {
    "title": "README for my-project",
    "content": "# my-project\n\nA modern web application built with Next.js and Python FastAPI.\n\n## Features\n\n- Real-time code analysis\n- AI-powered bug detection\n- Security vulnerability scanning\n- Automatic code refactoring suggestions\n\n## Tech Stack\n\n- **Frontend**: Next.js 16, TypeScript, Tailwind CSS\n- **Backend**: Python FastAPI\n- **Database**: Supabase (PostgreSQL)\n- **AI**: Ollama / Qwen3-Coder\n\n## Installation\n\n```bash\nnpm install\ncd backend && pip install -r requirements.txt\n```\n\n## Usage\n\n```bash\nnpm run dev\n```\n\n## License\n\nMIT",
    "format": "markdown"
}

MOCK_API_DOCS_RESPONSE = {
    "title": "API Documentation",
    "version": "1.0.0",
    "base_url": "http://localhost:8005",
    "endpoints": [
        {
            "path": "/analyze/all",
            "method": "POST",
            "description": "Run all static analysis tools on provided files",
            "request_body": "JSON array of files with path and content",
            "response_body": "JSON array of tool results with issues",
            "auth_required": False
        }
    ],
    "authentication": "No authentication required",
    "content": "# API Documentation\n\n## Base URL\n`http://localhost:8005`\n\n## Endpoints\n\n### POST /analyze/all\nRun all static analysis tools.\n\n**Request:**\n```json\n{\"files\": [{\"path\": \"main.py\", \"content\": \"...\"}]}\n```\n\n**Response:**\n```json\n[{\"tool\": \"ruff\", \"issues\": []}]\n```"
}

MOCK_ARCHITECTURE_RESPONSE = {
    "title": "Architecture Overview",
    "overview": "The application follows a microservices architecture with a Next.js frontend and Python FastAPI backend.",
    "patterns": ["Microservices", "REST API", "Repository Pattern", "Dependency Injection"],
    "components": [
        {"name": "Frontend", "description": "Next.js application with React components", "technology": "TypeScript"},
        {"name": "Backend API", "description": "FastAPI server handling analysis requests", "technology": "Python"}
    ],
    "data_flow": "User uploads code → Frontend sends to API → Python tools analyze → AI layer processes → Results returned to frontend",
    "content": "# Architecture Overview\n\nThe system is composed of a Next.js frontend and Python FastAPI backend..."
}

MOCK_FOLDER_EXPLANATION_RESPONSE = {
    "title": "Folder Structure",
    "sections": [
        {"path": "apps/web/src/", "purpose": "Next.js application source code", "key_files": ["layout.tsx", "page.tsx"]},
        {"path": "backend/app/", "purpose": "Python FastAPI backend", "key_files": ["main.py", "analyzers.py"]},
        {"path": "backend/app/ai/", "purpose": "AI provider abstraction layer", "key_files": ["base.py", "ollama.py", "mock.py", "factory.py"]}
    ],
    "content": "# Folder Structure\n\n## apps/web/src/\nNext.js application source code..."
}

MOCK_DEVELOPER_NOTES_RESPONSE = {
    "title": "Developer Onboarding Notes",
    "setup_steps": [
        "Clone the repository",
        "Run `npm install`",
        "Run `pip install -r backend/requirements.txt`",
        "Copy .env.example to .env.local and fill in values"
    ],
    "conventions": [
        "Use TypeScript for all frontend code",
        "Use async/await for all API calls",
        "Follow PEP 8 for Python code"
    ],
    "testing_approach": "Run `npm test` for frontend tests, `pytest` for backend tests.",
    "deployment": "Deploy using Docker with docker-compose up",
    "common_pitfalls": [
        "Ensure Ollama is running before using AI features",
        "Set AI_PROVIDER=ollama in production for real AI analysis"
    ],
    "content": "# Developer Onboarding Notes\n\n## Setup\n..."
}

MOCK_TEST_RESPONSE = {
    "file_path": "test.py",
    "framework": "pytest",
    "test_code": "import pytest\n\n\ndef test_example():\n    assert True\n\n\ndef test_edge_case():\n    with pytest.raises(ValueError):\n        raise ValueError(\"test\")\n",
    "test_file_path": "tests/test_test.py"
}


MOCK_SCORE_RESPONSE = {
    "overall_score": 72,
    "code_quality": 68,
    "security": 55,
    "performance": 80,
    "maintainability": 65,
    "strengths": [
        "Good use of functions and modular structure",
        "Clear naming conventions"
    ],
    "weaknesses": [
        "Missing error handling in several places",
        "Some hardcoded values that should be configurable"
    ],
    "recommendations": [
        "Add input validation to all public functions",
        "Move configuration to environment variables",
        "Add unit tests for core logic"
    ]
}


class MockProvider(AIProvider):
    @property
    def name(self) -> str:
        return "mock"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> str:
        if "Answer the question" in user_prompt or "Previous conversation" in user_prompt:
            return MOCK_CHAT_RESPONSE
        return json.dumps(MOCK_SCORE_RESPONSE)

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> dict:
        name = response_schema.__name__ if hasattr(response_schema, "__name__") else ""

        if "BugReport" in name:
            return MOCK_BUGS_RESPONSE
        if "SecurityReport" in name:
            return MOCK_SECURITY_RESPONSE
        if "RefactoringReport" in name:
            return MOCK_REFACTOR_RESPONSE
        if "ScoreReport" in name:
            return MOCK_SCORE_RESPONSE
        if "Documentation" in name:
            return MOCK_README_RESPONSE
        if "ApiDocs" in name:
            return MOCK_API_DOCS_RESPONSE
        if "Architecture" in name:
            return MOCK_ARCHITECTURE_RESPONSE
        if "FolderExplanation" in name:
            return MOCK_FOLDER_EXPLANATION_RESPONSE
        if "DeveloperNotes" in name:
            return MOCK_DEVELOPER_NOTES_RESPONSE
        if "GeneratedTest" in name:
            return MOCK_TEST_RESPONSE
        if "PRReviewResult" in name:
            return MOCK_PR_REVIEW_RESPONSE

        return MOCK_SCORE_RESPONSE
