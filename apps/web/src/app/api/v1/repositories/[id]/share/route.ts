import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team_id } = await req.json();

  const { data: repo } = await supabase
    .from("repositories")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  if (repo.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("owner_id")
      .eq("id", team_id)
      .single();

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.owner_id !== user.id) return NextResponse.json({ error: "Not your team" }, { status: 403 });
  }

  const { error } = await supabase
    .from("repositories")
    .update({ team_id: team_id || null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, team_id });
}
