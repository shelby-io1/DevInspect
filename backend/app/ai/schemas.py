from typing import Optional
from pydantic import BaseModel


class AIBug(BaseModel):
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    bug_type: str
    severity: str  # critical, high, medium, low
    title: str
    description: str
    suggestion: str


class AIBugReport(BaseModel):
    summary: str
    bugs: list[AIBug]


class AIBaseIssue(BaseModel):
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    title: str
    description: str
    suggestion: str


class AISecurityIssue(AIBaseIssue):
    vulnerability_type: str
    severity: str
    cwe_reference: Optional[str] = None


class AISecurityReport(BaseModel):
    summary: str
    risk_level: str  # low, medium, high, critical
    issues: list[AISecurityIssue]


class AIRefactoringSuggestion(BaseModel):
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    refactoring_type: str  # extract_method, rename, simplify, split, inline, other
    title: str
    description: str
    suggestion: str
    estimated_impact: str  # low, medium, high


class AIRefactoringReport(BaseModel):
    summary: str
    suggestions: list[AIRefactoringSuggestion]


class AIScoreReport(BaseModel):
    overall_score: int
    code_quality: int
    security: int
    performance: int
    maintainability: int
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]


class AIDocumentation(BaseModel):
    title: str
    content: str
    format: str = "markdown"


class AIApiEndpoint(BaseModel):
    path: str
    method: str
    description: str
    request_body: Optional[str] = None
    response_body: Optional[str] = None
    auth_required: bool = False


class AIApiDocs(BaseModel):
    title: str
    version: str
    base_url: str
    endpoints: list[AIApiEndpoint]
    authentication: str
    content: str


class AIArchitecture(BaseModel):
    title: str
    overview: str
    patterns: list[str]
    components: list[dict]
    data_flow: str
    content: str


class AIFolderExplanation(BaseModel):
    title: str
    sections: list[dict]
    content: str


class AIDeveloperNotes(BaseModel):
    title: str
    setup_steps: list[str]
    conventions: list[str]
    testing_approach: str
    deployment: str
    common_pitfalls: list[str]
    content: str


class AIGeneratedTest(BaseModel):
    file_path: str
    framework: str
    test_code: str
    test_file_path: str
