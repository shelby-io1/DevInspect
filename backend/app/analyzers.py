import subprocess
import os
import tempfile
import json
import re
from pathlib import Path
from .models import Issue, FileItem


SEMGREP_BIN = os.path.join(
    os.environ.get("APPDATA", ""),
    r"Python\Python314\Scripts\pysemgrep.exe"
)


def run_semgrep(files: list[FileItem]) -> list[Issue]:
    issues: list[Issue] = []
    tmpdir = tempfile.mkdtemp()

    try:
        for f in files:
            ext = os.path.splitext(f.path)[1].lower()
            supported = {".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".java", ".rb", ".rs", ".c", ".cpp", ".h", ".hpp"}
            if ext not in supported:
                continue

            fpath = os.path.join(tmpdir, f.path.lstrip("/\\"))
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8", errors="replace") as fh:
                fh.write(f.content)

        result = subprocess.run(
            [SEMGREP_BIN, "scan", "--config", "auto", "--json", "--quiet", "--no-git-ignore", tmpdir],
            capture_output=True, text=True, timeout=120
        )

        stdout = result.stdout
        json_start = stdout.find("{")
        if json_start == -1:
            return issues

        data = json.loads(stdout[json_start:])
        for r in data.get("results", []):
            path = r.get("path", "")
            rel_path = os.path.relpath(path, tmpdir).replace("\\", "/") if tmpdir in path else path
            extra = r.get("extra", {})
            metadata = extra.get("metadata", {})
            severity_raw = extra.get("severity", "WARNING")
            severity_map = {"ERROR": "critical", "WARNING": "medium", "INFO": "low"}
            cwe_list = metadata.get("cwe", [])
            cwe_str = cwe_list[0] if isinstance(cwe_list, list) and cwe_list else ""

            issues.append(Issue(
                rule_id=f"semgrep-{r.get('check_id', 'unknown')}",
                severity=severity_map.get(severity_raw, "medium"),
                category="security",
                file_path=rel_path,
                line_start=r.get("start", {}).get("line"),
                line_end=r.get("end", {}).get("line"),
                message=extra.get("message", "No description"),
                recommendation=f"CWE: {cwe_str}. Review and fix the security issue." if cwe_str else "Review and fix the security issue.",
                code_snippet=None,
            ))
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        pass
    finally:
        for root, dirs, files_in_tmp in os.walk(tmpdir, topdown=False):
            for name in files_in_tmp:
                try: os.remove(os.path.join(root, name))
                except: pass
            for name in dirs:
                try: os.rmdir(os.path.join(root, name))
                except: pass
        try: os.rmdir(tmpdir)
        except: pass

    return issues

IGNORED_DIRS = {"node_modules", ".git", "dist", "build", "coverage", ".next",
                "__pycache__", ".venv", "venv", ".idea", ".vscode", "target",
                "vendor", ".cache", ".turpo"}


def _write_files(temp_dir: str, files: list[FileItem]):
    for f in files:
        full_path = os.path.join(temp_dir, f.path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8", errors="replace") as fh:
            fh.write(f.content)


def _should_include(path: str) -> bool:
    parts = Path(path).parts
    return not any(p in IGNORED_DIRS for p in parts)


def run_ruff(files: list[FileItem]) -> list[Issue]:
    issues: list[Issue] = []
    py_files = [f for f in files if f.path.endswith(".py") and _should_include(f.path)]
    if not py_files:
        return issues

    with tempfile.TemporaryDirectory() as tmpdir:
        _write_files(tmpdir, py_files)

        py_paths = []
        for f in py_files:
            full = os.path.join(tmpdir, f.path)
            if os.path.exists(full):
                py_paths.append(full)

        if not py_paths:
            return issues

        result = subprocess.run(
            ["python", "-m", "ruff", "check", "--output-format", "json"] + py_paths,
            capture_output=True, text=True, timeout=60, cwd=tmpdir
        )

        if result.stdout:
            try:
                data = json.loads(result.stdout)
                for item in data:
                    sev_map = {
                        "critical": "critical",
                        "error": "high",
                        "warning": "medium",
                        "info": "low"
                    }
                    rel_path = os.path.relpath(item["filename"], tmpdir).replace("\\", "/")
                    code_snippet = None
                    if "location" in item:
                        try:
                            with open(item["filename"], "r", encoding="utf-8") as fh:
                                lines = fh.readlines()
                            idx = item["location"]["row"] - 1
                            if 0 <= idx < len(lines):
                                code_snippet = lines[idx].rstrip()
                        except Exception:
                            pass

                    issues.append(Issue(
                        rule_id=f"ruff-{item.get('code', 'unknown')}",
                        severity=sev_map.get(item.get("level", "warning"), "medium"),
                        category="code_style",
                        file_path=rel_path,
                        line_start=item.get("location", {}).get("row"),
                        line_end=item.get("end_location", {}).get("row"),
                        message=item.get("message", "Unknown ruff issue"),
                        recommendation=_get_ruff_recommendation(item.get("code", "")),
                        code_snippet=code_snippet
                    ))
            except (json.JSONDecodeError, KeyError):
                pass

    return issues


def _get_ruff_recommendation(code: str) -> str | None:
    recs = {
        "F401": "Remove unused import or use it in the module.",
        "F841": "Remove unused variable assignment.",
        "E302": "Add a blank line before the class or function definition.",
        "E303": "Reduce multiple blank lines to one.",
        "W291": "Remove trailing whitespace.",
        "F811": "Rename the redefined function or remove the duplicate definition.",
        "F821": "Define the undefined name before using it.",
    }
    return recs.get(code)


def run_bandit(files: list[FileItem]) -> list[Issue]:
    issues: list[Issue] = []
    py_files = [f for f in files if f.path.endswith(".py") and _should_include(f.path)]
    if not py_files:
        return issues

    with tempfile.TemporaryDirectory() as tmpdir:
        _write_files(tmpdir, py_files)

        py_paths = []
        for f in py_files:
            full = os.path.join(tmpdir, f.path)
            if os.path.exists(full):
                py_paths.append(full)

        if not py_paths:
            return issues

        result = subprocess.run(
            ["python", "-m", "bandit", "-f", "json", "-q"] + py_paths,
            capture_output=True, text=True, timeout=60, cwd=tmpdir
        )

        if result.stdout:
            try:
                data = json.loads(result.stdout)
                for item in data.get("results", []):
                    rel_path = os.path.relpath(item["filename"], tmpdir).replace("\\", "/")
                    sev_map = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
                    issues.append(Issue(
                        rule_id=f"bandit-{item['test_id']}",
                        severity=sev_map.get(item.get("issue_severity", "MEDIUM"), "medium"),
                        category="security",
                        file_path=rel_path,
                        line_start=item.get("line_number"),
                        line_end=item.get("line_range", [item.get("line_number")])[-1] if item.get("line_range") else item.get("line_number"),
                        message=item.get("issue_text", "Security issue detected by Bandit"),
                        recommendation=item.get("recommendation", "Review and fix the security vulnerability."),
                        code_snippet=item.get("code", "").strip() if item.get("code") else None
                    ))
            except (json.JSONDecodeError, KeyError):
                pass

    return issues


def run_eslint(files: list[FileItem]) -> list[Issue]:
    issues: list[Issue] = []
    supported = {".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".mts", ".cts"}
    tmpdir = tempfile.mkdtemp()

    npx_paths = [
        r"C:\Program Files\nodejs\npx.cmd",
        r"C:\Program Files\nodejs\npx.exe",
    ]
    npx_bin = next((p for p in npx_paths if os.path.isfile(p)), "npx")

    try:
        config = r"""export default [
  { rules: {
      "no-unused-vars": "warn", "no-undef": "warn", "no-eval": "warn",
      "no-console": "warn", "no-debugger": "warn", "prefer-const": "warn",
      "no-var": "warn", "eqeqeq": "warn", "curly": "warn",
      "no-empty": "warn", "no-redeclare": "error", "no-unreachable": "warn",
      "valid-typeof": "error", "no-duplicate-case": "error",
      "no-extra-boolean-cast": "warn", "no-throw-literal": "warn",
  } },
  { ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"] }
];"""
        with open(os.path.join(tmpdir, "eslint.config.mjs"), "w", encoding="utf-8") as fh:
            fh.write(config)

        js_files = []
        for f in files:
            ext = os.path.splitext(f.path)[1].lower()
            if ext not in supported:
                continue
            fpath = os.path.join(tmpdir, f.path.lstrip("/\\"))
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8", errors="replace") as fh:
                fh.write(f.content)
            js_files.append(fpath)

        if not js_files:
            return issues

        result = subprocess.run(
            [npx_bin, "eslint", "--format", "json", "--no-warn-ignored", tmpdir],
            capture_output=True, text=True, timeout=120, cwd=tmpdir
        )

        data = json.loads(result.stdout) if result.stdout.strip() else []
        severity_map = {2: "critical", 1: "medium"}

        for entry in data:
            file_path = entry.get("filePath", "")
            rel_path = os.path.relpath(file_path, tmpdir).replace("\\", "/")
            for msg in entry.get("messages", []):
                if msg.get("fatal"):
                    continue
                rule_id = msg.get("ruleId", "unknown")
                issues.append(Issue(
                    rule_id=f"eslint-{rule_id}",
                    severity=severity_map.get(msg.get("severity", 1), "medium"),
                    category="code_style" if msg.get("severity") == 1 else "potential_bug",
                    file_path=rel_path,
                    line_start=msg.get("line"),
                    line_end=msg.get("endLine"),
                    message=msg.get("message", "No description"),
                    recommendation=f"ESLint rule: {rule_id}. Review and fix the issue." if rule_id != "unknown" else "Review and fix the issue.",
                    code_snippet=None,
                ))
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        pass
    finally:
        for root, dirs, files_in_tmp in os.walk(tmpdir, topdown=False):
            for name in files_in_tmp:
                try: os.remove(os.path.join(root, name))
                except: pass
            for name in dirs:
                try: os.rmdir(os.path.join(root, name))
                except: pass
        try: os.rmdir(tmpdir)
        except: pass

    return issues
