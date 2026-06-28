import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const BACKEND_URL = env.BACKEND_URL;

async function fetchPRFiles(repoUrl: string, prNumber: number): Promise<{ path: string; content: string }[]> {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\/|$)/i);
  if (!match) return [];
  const repoPath = match[1];
  const apiUrl = `https://api.github.com/repos/${repoPath}/pulls/${prNumber}/files`;

  const res = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "DevInspect" },
  });

  if (!res.ok) return [];

  const files = await res.json();
  const result: { path: string; content: string }[] = [];

  for (const file of files.slice(0, 20)) {
    if (file.patch) {
      result.push({ path: file.filename, content: file.patch });
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { repoUrl, prNumber, files } = body;

    if (!repoUrl || !prNumber) {
      return NextResponse.json({ error: "repoUrl and prNumber are required" }, { status: 400 });
    }

    const prFiles = files?.length > 0 ? files : await fetchPRFiles(repoUrl, prNumber);

    const res = await fetch(`${BACKEND_URL}/review/pr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: repoUrl,
        pr_number: prNumber,
        files: prFiles,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Review service unavailable" }, { status: 502 });
    }

    const result = await res.json();

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "pr_review_complete",
      title: `PR #${prNumber} review complete`,
      message: result.summary?.slice(0, 200) || "Review completed",
      data: { repoUrl, prNumber, summary: result.summary },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "PR review failed",
    }, { status: 500 });
  }
}
