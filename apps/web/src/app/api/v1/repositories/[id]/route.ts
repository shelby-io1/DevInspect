import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: repo, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const { data: files } = await supabase
    .from("repository_files")
    .select("id, path, language, size")
    .eq("repository_id", id)
    .order("path");

  return NextResponse.json({ ...repo, files });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("repositories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
