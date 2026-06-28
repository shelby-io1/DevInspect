"""Tests for AI provider abstraction layer."""

import pytest
from app.ai.factory import ProviderFactory
from app.ai.schemas import (
    AIBugReport, AISecurityReport, AIRefactoringReport, AIScoreReport,
    AIDocumentation, AIArchitecture, AIDeveloperNotes, AIGeneratedTest,
)
from app.ai.chunking import chunk_files, format_chunk_for_prompt, FileChunk
from app.ai.prompts import (
    build_bug_prompt, build_score_prompt,
    build_readme_prompt, build_api_docs_prompt,
    build_test_prompt, build_developer_notes_prompt,
)


@pytest.mark.asyncio
async def test_mock_provider_generate():
    provider = ProviderFactory.create()
    result = await provider.generate("system", "user")
    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_mock_provider_structured_bugs():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIBugReport)
    assert "bugs" in result
    assert len(result["bugs"]) >= 1


@pytest.mark.asyncio
async def test_mock_provider_structured_security():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AISecurityReport)
    assert "issues" in result


@pytest.mark.asyncio
async def test_mock_provider_structured_score():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIScoreReport)
    assert "overall_score" in result
    assert "strengths" in result


@pytest.mark.asyncio
async def test_mock_provider_structured_readme():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIDocumentation)
    assert "title" in result
    assert "content" in result


@pytest.mark.asyncio
async def test_mock_provider_structured_architecture():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIArchitecture)
    assert "overview" in result
    assert "patterns" in result


@pytest.mark.asyncio
async def test_mock_provider_structured_devnotes():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIDeveloperNotes)
    assert "setup_steps" in result
    assert "conventions" in result


@pytest.mark.asyncio
async def test_mock_provider_structured_tests():
    provider = ProviderFactory.create()
    result = await provider.generate_structured("system", "user", AIGeneratedTest)
    assert "test_code" in result
    assert "framework" in result


def test_chunk_files_empty():
    result = chunk_files([])
    assert result == []


def test_chunk_files_single():
    files = [{"path": "test.py", "content": "x = 1"}]
    result = chunk_files(files)
    assert len(result) >= 1


def test_chunk_files_large():
    # 15000 lines to exceed both char and line limits
    files = [{"path": "big.py", "content": ("x=" + "1" * 80 + "\n") * 15000}]
    result = chunk_files(files)
    assert len(result) > 1


def test_format_chunk():
    chunk = [FileChunk("test.py", "print('hi')", 0)]
    formatted = format_chunk_for_prompt(chunk)
    assert "test.py" in formatted
    assert "print" in formatted


def test_build_prompts():
    readme = build_readme_prompt("code", "test", "Python")
    assert "test" in readme

    bug = build_bug_prompt("code")
    assert "code" in bug

    score = build_score_prompt("code", [])
    assert "code" in score

    api = build_api_docs_prompt("code")
    assert "code" in api

    test = build_test_prompt("code", "file.py")
    assert "pytest" in test

    notes = build_developer_notes_prompt("code", "Python")
    assert "Python" in notes


def test_provider_factory_default():
    provider = ProviderFactory.create()
    assert provider is not None
    assert provider.name == "mock"


def test_provider_factory_invalid():
    with pytest.raises(ValueError, match="Unknown AI provider"):
        ProviderFactory.create("nonexistent")
