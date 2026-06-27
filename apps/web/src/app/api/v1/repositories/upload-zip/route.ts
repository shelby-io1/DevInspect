import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/github";

const IGNORED_PATHS = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".next",
  "__pycache__", ".venv", "venv", ".idea", ".vscode", "target",
  "vendor", ".cache", "public/build", ".turbo"
]);

function shouldIgnore(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.some((part) => IGNORED_PATHS.has(part));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ZIP file is required" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "Only .zip files are accepted" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const repoName = file.name.replace(/\.zip$/i, "") || "unnamed-repo";

    const { data: repo, error: insertError } = await supabase
      .from("repositories")
      .insert({
        user_id: user.id,
        name: repoName,
        full_name: repoName,
        source: "upload",
        status: "importing"
      })
      .select()
      .single();

    if (insertError || !repo) {
      return NextResponse.json({ error: insertError?.message || "Failed to create repository" }, { status: 500 });
    }

    const fileRows: {
      repository_id: string;
      path: string;
      content: string;
      language: string | null;
      size: number;
    }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const entryPath = entry.entryName.replace(/\\/g, "/");
      if (shouldIgnore(entryPath)) continue;

      const content = entry.getData().toString("utf-8");
      fileRows.push({
        repository_id: repo.id,
        path: entryPath,
        content,
        language: detectLanguage(entryPath),
        size: content.length
      });
    }

    if (fileRows.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < fileRows.length; i += batchSize) {
        const batch = fileRows.slice(i, i + batchSize);
        const { error: filesError } = await supabase
          .from("repository_files")
          .insert(batch);

        if (filesError) {
          await supabase.from("repositories").update({ status: "error", error_message: filesError.message }).eq("id", repo.id);
          return NextResponse.json({ error: filesError.message }, { status: 500 });
        }
      }
    }

    const langCounts: Record<string, number> = {};
    for (const f of fileRows) {
      if (f.language) langCounts[f.language] = (langCounts[f.language] || 0) + 1;
    }

    await supabase
      .from("repositories")
      .update({
        status: "ready",
        metadata: { file_count: fileRows.length, languages: langCounts }
      })
      .eq("id", repo.id);

    return NextResponse.json({ ...repo, files_count: fileRows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process ZIP file" },
      { status: 500 }
    );
  }
}
