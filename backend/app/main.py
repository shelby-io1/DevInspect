from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import AnalysisRequest, AnalysisResponse, Issue
from .analyzers import run_ruff, run_bandit, run_semgrep, run_eslint
from .ai import ProviderFactory, chunk_files, format_chunk_for_prompt, prompts
from .ai.schemas import (
    AIBugReport, AISecurityReport, AIRefactoringReport, AIScoreReport,
    AIDocumentation, AIApiDocs, AIArchitecture, AIFolderExplanation,
    AIDeveloperNotes, AIGeneratedTest,
)
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="DevInspect Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AIAnalysisRequest(BaseModel):
    files: list[dict]
    existing_issues: Optional[list[dict]] = None


def get_provider():
    return ProviderFactory.create()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze/ruff", response_model=AnalysisResponse)
def analyze_ruff(req: AnalysisRequest):
    issues = run_ruff(req.files)
    return AnalysisResponse(tool="ruff", issues=issues)


@app.post("/analyze/bandit", response_model=AnalysisResponse)
def analyze_bandit(req: AnalysisRequest):
    issues = run_bandit(req.files)
    return AnalysisResponse(tool="bandit", issues=issues)


@app.post("/analyze/semgrep", response_model=AnalysisResponse)
def analyze_semgrep(req: AnalysisRequest):
    issues = run_semgrep(req.files)
    return AnalysisResponse(tool="semgrep", issues=issues)


@app.post("/analyze/eslint", response_model=AnalysisResponse)
def analyze_eslint(req: AnalysisRequest):
    issues = run_eslint(req.files)
    return AnalysisResponse(tool="eslint", issues=issues)


@app.post("/analyze/all", response_model=list[AnalysisResponse])
def analyze_all(req: AnalysisRequest):
    return [
        AnalysisResponse(tool="ruff", issues=run_ruff(req.files)),
        AnalysisResponse(tool="bandit", issues=run_bandit(req.files)),
        AnalysisResponse(tool="semgrep", issues=run_semgrep(req.files)),
        AnalysisResponse(tool="eslint", issues=run_eslint(req.files)),
    ]


@app.post("/analyze/ai/bugs")
async def analyze_ai_bugs(req: AIAnalysisRequest):
    try:
        provider = get_provider()
        chunks = chunk_files(req.files)
        all_bugs = []

        for chunk in chunks:
            context = format_chunk_for_prompt(chunk)
            prompt = prompts.build_bug_prompt(context)
            result = await provider.generate_structured(
                system_prompt=prompts.BUG_DETECTION_SYSTEM,
                user_prompt=prompt,
                response_schema=AIBugReport,
            )
            report = AIBugReport(**result)
            all_bugs.extend([b.model_dump() for b in report.bugs])

        return {"summary": f"Found {len(all_bugs)} potential bugs", "bugs": all_bugs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/ai/security")
async def analyze_ai_security(req: AIAnalysisRequest):
    try:
        provider = get_provider()
        chunks = chunk_files(req.files)
        all_issues = []

        for chunk in chunks:
            context = format_chunk_for_prompt(chunk)
            prompt = prompts.build_security_prompt(context)
            result = await provider.generate_structured(
                system_prompt=prompts.SECURITY_SYSTEM,
                user_prompt=prompt,
                response_schema=AISecurityReport,
            )
            report = AISecurityReport(**result)
            all_issues.extend([i.model_dump() for i in report.issues])

        return {"summary": f"Found {len(all_issues)} security issues", "issues": all_issues}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/ai/refactor")
async def analyze_ai_refactor(req: AIAnalysisRequest):
    try:
        provider = get_provider()
        chunks = chunk_files(req.files)
        all_suggestions = []

        for chunk in chunks:
            context = format_chunk_for_prompt(chunk)
            prompt = prompts.build_refactoring_prompt(context)
            result = await provider.generate_structured(
                system_prompt=prompts.REFACTORING_SYSTEM,
                user_prompt=prompt,
                response_schema=AIRefactoringReport,
            )
            report = AIRefactoringReport(**result)
            all_suggestions.extend([s.model_dump() for s in report.suggestions])

        return {"summary": f"Found {len(all_suggestions)} refactoring opportunities", "suggestions": all_suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ChatRequest(BaseModel):
    question: str
    files: list[dict]
    history: Optional[list[dict]] = None


class PRReviewRequest(BaseModel):
    repo_url: str
    pr_number: int
    files: Optional[list[dict]] = None


class GenerateRequest(BaseModel):
    files: list[dict]
    repo_name: Optional[str] = "my-project"
    language: Optional[str] = "Unknown"
    folder_structure: Optional[str] = None
    file_path: Optional[str] = None


CHAT_SYSTEM = """You are a codebase expert assistant. Answer questions about the provided code files.
Be concise and specific. Reference file paths and line numbers when relevant.
If you don't know the answer, say so rather than guessing."""

PR_REVIEW_SYSTEM = """You are a senior code reviewer reviewing a pull request.
Analyze the provided diff and identify:
1. Bugs and logic errors
2. Security vulnerabilities
3. Code quality issues
4. Performance concerns
5. Best practice violations
For each issue, provide the file, line range, severity, description, and fix suggestion."""


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


class PRReviewResult(BaseModel):
    summary: str
    issues: list[dict]
    approved: bool
    suggestions: list[str]


@app.post("/chat")
async def chat_with_repo(req: ChatRequest):
    try:
        context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:10])
        history_text = ""
        if req.history:
            for h in req.history[-5:]:
                history_text += f"Q: {h.get('question', '')}\nA: {h.get('answer', '')}\n\n"
        prompt = f"""Previous conversation:
{history_text}
Files in repository:
{context[:6000]}

Question: {req.question}

Answer the question based on the code above."""
        provider = ProviderFactory.create()
        answer = await provider.generate(
            system_prompt=CHAT_SYSTEM,
            user_prompt=prompt,
            max_tokens=2048,
            temperature=0.3,
        )
        sources = [f.get("path", "") for f in req.files[:10] if f.get("path")]
        return ChatResponse(answer=answer, sources=sources[:5])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/review/pr")
async def review_pull_request(req: PRReviewRequest):
    try:
        if req.files:
            context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:30])
        else:
            context = f"PR #{req.pr_number} from {req.repo_url}"
        prompt = f"""Repository: {req.repo_url}
PR Number: {req.pr_number}

Code changes to review:
{context[:8000]}

Provide a thorough code review."""
        provider = ProviderFactory.create()
        result = await provider.generate_structured(
            system_prompt=PR_REVIEW_SYSTEM,
            user_prompt=prompt,
            response_schema=PRReviewResult,
            max_tokens=4096,
            temperature=0.2,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_with_provider(system_prompt: str, user_prompt: str, schema: type) -> dict:
    provider = ProviderFactory.create()
    return await provider.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_schema=schema,
    )


@app.post("/generate/readme")
async def generate_readme(req: GenerateRequest):
    try:
        context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:20])
        prompt = prompts.build_readme_prompt(context[:8000], req.repo_name or "my-project", req.language or "Unknown")
        result = await _generate_with_provider(prompts.README_SYSTEM, prompt, AIDocumentation)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/api-docs")
async def generate_api_docs(req: GenerateRequest):
    try:
        context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files if any(k in f.get('path','').lower() for k in ['api','route','controller','handler','endpoint','view']))
        if not context:
            context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:10])
        prompt = prompts.build_api_docs_prompt(context[:8000])
        result = await _generate_with_provider(prompts.API_DOCS_SYSTEM, prompt, AIApiDocs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/architecture")
async def generate_architecture(req: GenerateRequest):
    try:
        context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:30])
        prompt = prompts.build_architecture_prompt(context[:8000])
        result = await _generate_with_provider(prompts.ARCHITECTURE_SYSTEM, prompt, AIArchitecture)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/folder-explanation")
async def generate_folder_explanation(req: GenerateRequest):
    try:
        fs = req.folder_structure or "\n".join(f.get("path", "?") for f in req.files)
        prompt = prompts.build_folder_explanation_prompt(fs[:4000])
        result = await _generate_with_provider(prompts.FOLDER_EXPLANATION_SYSTEM, prompt, AIFolderExplanation)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/developer-notes")
async def generate_developer_notes(req: GenerateRequest):
    try:
        context = "\n\n".join(f"--- {f.get('path','?')}\n{f.get('content','')}" for f in req.files[:20])
        prompt = prompts.build_developer_notes_prompt(context[:8000], req.language or "Unknown")
        result = await _generate_with_provider(prompts.DEVELOPER_NOTES_SYSTEM, prompt, AIDeveloperNotes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/tests")
async def generate_tests(req: GenerateRequest):
    try:
        file_path = req.file_path or (req.files[0].get("path", "unknown") if req.files else "unknown")
        content = next((f.get("content", "") for f in req.files if f.get("path") == file_path), req.files[0].get("content", "") if req.files else "")
        if not content:
            content = "\n\n".join(f.get("content", "") for f in req.files[:5])
        prompt = prompts.build_test_prompt(content[:8000], file_path)
        result = await _generate_with_provider(prompts.TEST_GENERATION_SYSTEM, prompt, AIGeneratedTest)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/ai/score")
async def analyze_ai_score(req: AIAnalysisRequest):
    try:
        provider = get_provider()
        context_parts = []
        total_chars = 0
        max_input = 6000

        for f in req.files:
            content = f.get("content", "")
            if total_chars + len(content) > max_input:
                remaining = max_input - total_chars
                if remaining > 100:
                    context_parts.append(f"--- {f.get('path', '?')}\n{content[:remaining]}")
                break
            context_parts.append(f"--- {f.get('path', '?')}\n{content}")
            total_chars += len(content)

        context = "\n\n".join(context_parts)
        existing = req.existing_issues or []
        prompt = prompts.build_score_prompt(context, existing)

        result = await provider.generate_structured(
            system_prompt=prompts.SCORE_SYSTEM,
            user_prompt=prompt,
            response_schema=AIScoreReport,
        )
        return AIScoreReport(**result).model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
