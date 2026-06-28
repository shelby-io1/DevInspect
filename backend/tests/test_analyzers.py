"""Tests for static code analyzers (ruff, bandit, semgrep, eslint)."""

import pytest
from app.analyzers import run_ruff, run_bandit, run_semgrep, run_eslint
from app.models import FileItem


SIMPLE_PY = FileItem(path="test.py", content="x = 1\nprint(x)\n")
BUGGY_PY = FileItem(path="test.py", content="import os\nprint(eval('1+1'))\n")
SIMPLE_JS = FileItem(path="test.js", content="var x = 1;\nconsole.log(x)\n")
UNUSED_JS = FileItem(path="test.js", content="var hello = 'world';\n")
EMPTY_PY = FileItem(path="empty.py", content="")
EMPTY_JS = FileItem(path="empty.js", content="")


def test_ruff_clean():
    issues = run_ruff([SIMPLE_PY])
    assert isinstance(issues, list)


def test_ruff_buggy():
    issues = run_ruff([BUGGY_PY])
    assert isinstance(issues, list)


def test_ruff_empty():
    issues = run_ruff([EMPTY_PY])
    assert issues == []


def test_ruff_non_python():
    run_ruff([SIMPLE_JS])  # no crash


def test_bandit_buggy():
    issues = run_bandit([BUGGY_PY])
    assert len(issues) >= 1
    assert any("eval" in i.message.lower() for i in issues)


def test_bandit_empty():
    issues = run_bandit([EMPTY_PY])
    assert issues == []


def test_semgrep_buggy():
    issues = run_semgrep([BUGGY_PY])
    assert isinstance(issues, list)


def test_semgrep_empty():
    issues = run_semgrep([EMPTY_PY])
    assert issues == []


def test_eslint_basic():
    issues = run_eslint([UNUSED_JS])
    assert len(issues) >= 1
    # "hello" is defined but never used
    assert any("never used" in i.message.lower() or "unused" in i.message.lower() for i in issues)


def test_eslint_empty():
    issues = run_eslint([EMPTY_JS])
    assert issues == []


def test_eslint_non_js():
    issues = run_eslint([BUGGY_PY])
    assert issues == []


def test_all_analyzers_empty():
    for analyzer in [run_ruff, run_bandit, run_semgrep, run_eslint]:
        issues = analyzer([])
        assert issues == []
