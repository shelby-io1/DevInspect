export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  stars: number;
  url: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  size: number;
}

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "mdx", "json", "yaml", "yml", "xml", "toml", "ini", "cfg", "conf",
  "js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts",
  "py", "rb", "go", "rs", "java", "kt", "swift", "php", "cs", "scala",
  "c", "cpp", "h", "hpp", "mm", "m",
  "html", "css", "scss", "less", "sass", "svg",
  "sql", "graphql", "prisma",
  "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
  "env", "editorconfig", "gitignore", "dockerfile", "makefile",
  "vue", "svelte", "astro",
  "tf", "hcl", "proto",
  "lock", "gradle", "properties"
]);

const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "ico", "webp", "bmp",
  "woff", "woff2", "ttf", "eot", "otf",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "zip", "tar", "gz", "bz2", "7z", "rar",
  "exe", "dll", "so", "dylib", "wasm",
  "mp3", "mp4", "avi", "mov", "wav", "flac", "ogg",
  "psd", "ai"
]);

export function isTextFile(path: string, size?: number): boolean {
  const name = path.toLowerCase();
  if (name === "dockerfile" || name === "makefile") return true;
  if (name.endsWith(".gitignore") || name.endsWith(".editorconfig") || name.endsWith(".env")) return true;
  const ext = name.split(".").pop() || "";
  if (BINARY_EXTENSIONS.has(ext)) return false;
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (!ext && size != null && size > 0 && size < 102400) return true;
  return ext === "";
}

const IGNORED_PATHS = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".next",
  "__pycache__", ".venv", "venv", ".idea", ".vscode", "target",
  "vendor", ".cache", "public/build", ".turbo"
]);

function shouldIgnore(path: string): boolean {
  const parts = path.split("/");
  return parts.some((part) => IGNORED_PATHS.has(part));
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  js: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  py: "Python", rb: "Ruby", go: "Go", rs: "Rust", java: "Java",
  kt: "Kotlin", swift: "Swift", php: "PHP", cs: "C#",
  c: "C", cpp: "C++", h: "C", hpp: "C++",
  html: "HTML", css: "CSS", scss: "SCSS", less: "Less",
  json: "JSON", yml: "YAML", yaml: "YAML", xml: "XML", md: "Markdown",
  sql: "SQL", sh: "Shell", bash: "Shell", zsh: "Shell",
  dockerfile: "Dockerfile", tf: "Terraform", vue: "Vue", svelte: "Svelte",
  prisma: "Prisma", graphql: "GraphQL", toml: "TOML"
};

export function detectLanguage(filename: string): string | null {
  const name = filename.toLowerCase();
  if (name === "dockerfile") return "Dockerfile";
  const ext = name.split(".").pop();
  return ext ? EXTENSION_LANGUAGE_MAP[ext] ?? null : null;
}

export async function fetchGitHubRepoInfo(url: string): Promise<GitHubRepoInfo> {
  const match = url.match(/github\.com\/([^/]+\/[^/]+?)(?:\/|$|\.git)/);
  if (!match) {
    throw new Error("Invalid GitHub URL. Expected format: https://github.com/owner/repo");
  }

  const repoPath = match[1].replace(/\.git$/, "");
  const apiUrl = `https://api.github.com/repos/${repoPath}`;

  const res = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "DevInspect" }
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.");
    if (res.status === 404) throw new Error("Repository not found. Check the URL.");
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    language: data.language,
    default_branch: data.default_branch,
    stars: data.stargazers_count,
    url: data.html_url
  };
}

export async function fetchGitHubFiles(
  url: string,
  branch?: string
): Promise<GitHubFile[]> {
  const match = url.match(/github\.com\/([^/]+\/[^/]+?)(?:\/|$|\.git)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const repoPath = match[1].replace(/\.git$/, "");
  const branchParam = branch || "main";
  const apiUrl = `https://api.github.com/repos/${repoPath}/git/trees/${branchParam}?recursive=1`;

  const res = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "DevInspect" }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch repository files: ${res.status}`);
  }

  const data = await res.json();
  const files: GitHubFile[] = [];
  const contents: { path: string; size: number }[] = [];

  if (!data.tree) return files;

  for (const item of data.tree) {
    if (item.type !== "blob") continue;
    if (shouldIgnore(item.path)) continue;
    if (!isTextFile(item.path, item.size)) continue;
    contents.push({ path: item.path, size: item.size || 0 });
  }

  const batchSize = 20;
  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repoPath}/${branchParam}/${file.path}`;
          const rawRes = await fetch(rawUrl, {
            headers: { "User-Agent": "DevInspect" }
          });
          if (!rawRes.ok) return null;
          const text = await rawRes.text();
          if (text.includes("\x00")) return null;
          return { path: file.path, content: text, size: file.size };
        } catch {
          return null;
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        files.push(result.value);
      }
    }
  }

  return files;
}
