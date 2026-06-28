import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

async function enrichMembers(teams: any[]) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return teams;
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  if (!users) return teams;
  const emailMap = new Map(users.map(u => [u.id, u.email]));
  return teams.map((t: any) => ({
    ...t,
    team_members: (t.team_members || []).map((m: any) => ({
      ...m,
      email: emailMap.get(m.user_id) || null,
    })),
  }));
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: owned }, { data: memberData }] = await Promise.all([
    supabase.from("teams").select("*, team_members(*)").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("team_members").select("team_id").eq("user_id", user.id),
  ]);

  const memberTeamIds = (memberData || []).map((m: { team_id: string }) => m.team_id);
  let memberOf: any[] = [];
  if (memberTeamIds.length > 0) {
    const { data } = await supabase
      .from("teams")
      .select("*, team_members(*)")
      .in("id", memberTeamIds)
      .not("owner_id", "eq", user.id)
      .order("created_at", { ascending: false });
    memberOf = data || [];
  }

  const allTeams = await enrichMembers([...(owned || []), ...memberOf]);

  const teamIds = allTeams.map((t: any) => t.id);
  let reposByTeam: Record<string, any[]> = {};
  let lastMsgByTeam: Record<string, string | null> = {};
  if (teamIds.length > 0) {
    const [{ data: sharedRepos }, { data: lastMsgs }] = await Promise.all([
      supabase.from("repositories").select("id, name, full_name, status, created_at, team_id").in("team_id", teamIds),
      supabase.from("team_messages").select("team_id, created_at").in("team_id", teamIds).order("created_at", { ascending: false }),
    ]);
    if (sharedRepos) {
      for (const r of sharedRepos) {
        (reposByTeam[r.team_id] ||= []).push(r);
      }
    }
    if (lastMsgs) {
      const seen = new Set<string>();
      for (const m of lastMsgs) {
        if (!seen.has(m.team_id)) {
          seen.add(m.team_id);
          lastMsgByTeam[m.team_id] = m.created_at;
        }
      }
    }
  }

  return NextResponse.json(
    allTeams.map((t: any) => ({ ...t, shared_repos: reposByTeam[t.id] || [], last_message_created_at: lastMsgByTeam[t.id] || null }))
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const { data: team, error } = await supabase.from("teams").insert({
      name, description, owner_id: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id, user_id: user.id, role: "owner", invited_by: user.id,
    });

    if (memberError) {
      await supabase.from("teams").delete().eq("id", team.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json(team);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
