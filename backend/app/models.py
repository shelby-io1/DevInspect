from pydantic import BaseModel
from typing import Optional


class FileItem(BaseModel):
    path: str
    content: str


class AnalysisRequest(BaseModel):
    files: list[FileItem]


class Issue(BaseModel):
    rule_id: str
    severity: str
    category: str
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    message: str
    recommendation: Optional[str] = None
    code_snippet: Optional[str] = None


class AnalysisResponse(BaseModel):
    tool: str
    issues: list[Issue]
