from typing import Optional


class FileChunk:
    def __init__(self, file_path: str, content: str, start_line: int = 0):
        self.file_path = file_path
        self.content = content
        self.start_line = start_line

    @property
    def line_count(self) -> int:
        return len(self.content.split("\n"))

    def __repr__(self) -> str:
        return f"FileChunk(path={self.file_path}, lines={self.line_count}, start={self.start_line})"


MAX_CONTEXT_WINDOW = 8000  # tokens, approximate
CHARS_PER_TOKEN = 4


def chunk_files(
    files: list[dict],
    max_chars: Optional[int] = None,
) -> list[list[FileChunk]]:
    if max_chars is None:
        max_chars = MAX_CONTEXT_WINDOW * CHARS_PER_TOKEN

    chunks: list[list[FileChunk]] = [[]]
    current_size = 0

    for f in files:
        path = f.get("path", "unknown")
        content = f.get("content", "")

        if not content:
            continue

        lines = content.split("\n")
        file_chars = len(content)

        if file_chars > max_chars:
            offset = 0
            while offset < len(lines):
                batch = lines[offset: offset + (max_chars // CHARS_PER_TOKEN)]
                fc = FileChunk(path, "\n".join(batch), offset)
                chunks.append([fc])
                offset += len(batch)
                current_size = len(batch) * CHARS_PER_TOKEN
            continue

        if current_size + file_chars > max_chars:
            chunks.append([])
            current_size = 0

        chunks[-1].append(FileChunk(path, content))
        current_size += file_chars

    return [c for c in chunks if c]


def format_chunk_for_prompt(chunk: list[FileChunk]) -> str:
    parts = []
    for fc in chunk:
        header = f"--- {fc.file_path}" + (f" (line {fc.start_line + 1})" if fc.start_line else "")
        parts.append(f"{header}\n{fc.content}")
    return "\n\n".join(parts)
