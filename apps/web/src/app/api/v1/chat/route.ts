import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const BACKEND_URL = env.BACKEND_URL;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, repositoryId, files, history } = body;

    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        files: files || [],
        history: history || [],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Chat service unavailable" }, { status: 502 });
    }

    const result = await res.json();

    // Store in chat history
    if (repositoryId) {
      await supabase.from("chat_history").insert({
        repository_id: repositoryId,
        user_id: user.id,
        question,
        answer: result.answer,
        context_files: result.sources || [],
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Chat failed",
    }, { status: 500 });
  }
}
