import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGitHubRepoInfo, fetchGitHubFiles, detectLanguage } from "@/lib/github";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "GitHub URL is required" }, { status: 400 });
  }

  try {
    const info = await fetchGitHubRepoInfo(url);

    const { data: repo, error: insertError } = await supabase
      .from("repositories")
      .insert({
        user_id: user.id,
        name: info.name,
        full_name: info.full_name,
        url: info.url,
        description: info.description,
        language: info.language,
        default_branch: info.default_branch,
        stars: info.stars,
        source: "github",
        status: "importing"
      })
      .select()
      .single();

    if (insertError || !repo) {
      return NextResponse.json({ error: insertError?.message || "Failed to create repository" }, { status: 500 });
    }

    const files = await fetchGitHubFiles(url, info.default_branch);

    if (files.length > 0) {
      const fileRows = files.map((f) => ({
        repository_id: repo.id,
        path: f.path,
        content: f.content,
        language: detectLanguage(f.path),
        size: f.size
      }));

      const { error: filesError } = await supabase
        .from("repository_files")
        .insert(fileRows);

      if (filesError) {
        await supabase.from("repositories").update({ status: "error", error_message: filesError.message }).eq("id", repo.id);
        return NextResponse.json({ error: filesError.message }, { status: 500 });
      }
    }

    const langCounts: Record<string, number> = {};
    for (const f of files) {
      const lang = detectLanguage(f.path);
      if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
    }

    await supabase
      .from("repositories")
      .update({
        status: "ready",
        metadata: { file_count: files.length, languages: langCounts }
      })
      .eq("id", repo.id);

    return NextResponse.json({ ...repo, files_count: files.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import repository" },
      { status: 500 }
    );
  }
}
