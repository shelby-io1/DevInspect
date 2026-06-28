"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, UserMinus, UserPlus, Mail, X, GitBranch, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { TeamChat } from "@/components/team-chat";

interface TeamMember {
  user_id: string;
  role: string;
  email?: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  team_members?: TeamMember[];
  shared_repos?: { id: string; name: string; full_name: string | null; status: string; created_at: string }[];
  last_message_created_at?: string | null;
}

function getUnreadCount(team: Team, currentUserId: string): number {
  if (!team.last_message_created_at) return 0;
  const key = `chat_read:${team.id}:${currentUserId}`;
  const lastRead = localStorage.getItem(key);
  if (!lastRead) return 1;
  return new Date(team.last_message_created_at) > new Date(lastRead) ? 1 : 0;
}

function markChatRead(teamId: string, currentUserId: string) {
  const key = `chat_read:${teamId}:${currentUserId}`;
  localStorage.setItem(key, new Date().toISOString());
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"member" | "admin">("member");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatTeamId, setChatTeamId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/v1/teams");
    if (res.ok) {
      setTeams(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    if (!currentUserId || teams.length === 0) return;
    const counts: Record<string, number> = {};
    for (const t of teams) {
      if (t.last_message_created_at) {
        const c = getUnreadCount(t, currentUserId);
        if (c > 0) counts[t.id] = c;
      }
    }
    setUnreadCounts(counts);
  }, [teams, currentUserId]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/v1/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
    });
    if (res.ok) {
      setShowCreate(false);
      setName("");
      setDesc("");
      fetchTeams();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to create team" }));
      setCreateError(err.error || "Failed to create team");
    }
    setCreating(false);
  }

  async function handleAddMember(teamId: string) {
    if (!memberEmail.trim()) return;
    setAdding(true);
    setAddError("");
    const res = await fetch(`/api/v1/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail.trim(), role: memberRole }),
    });
    if (res.ok) {
      setAddingTo(null);
      setMemberEmail("");
      setMemberRole("member");
      fetchTeams();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to add member" }));
      setAddError(err.error || "Failed to add member");
    }
    setAdding(false);
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    setRemoving(userId);
    await fetch(`/api/v1/teams/${teamId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setRemoving(null);
    fetchTeams();
  }

  if (loading) return null;

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Teams</h1>
            <p className="mt-1 text-sm text-muted-foreground">Collaborate with your team on code reviews.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New team
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="mt-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-600">No teams yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create a team to collaborate on code reviews.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {teams.map((team) => {
              const members = team.team_members || [];

              return (
              <div key={team.id} className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    {team.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{team.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {members.length || 1} member{(members.length || 1) !== 1 ? "s" : ""}
                    </span>
                    {currentUserId === team.owner_id && (
                      <Button size="sm" variant="outline" onClick={() => setAddingTo(team.id)}>
                        <UserPlus className="h-3.5 w-3.5" />
                        Add member
                      </Button>
                    )}
                    <button
                      onClick={() => {
                        if (chatTeamId !== team.id && currentUserId) {
                          markChatRead(team.id, currentUserId);
                          setUnreadCounts(prev => { const n = { ...prev }; delete n[team.id]; return n; });
                        }
                        setChatTeamId(chatTeamId === team.id ? null : team.id);
                      }}
                      className={`relative rounded-md p-2 transition ${
                        unreadCounts[team.id] ? "bg-blue-50 text-blue-700" :
                        chatTeamId === team.id ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      }`}
                      title="Team chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {unreadCounts[team.id] ? (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {unreadCounts[team.id]}
                        </span>
                      ) : null}
                    </button>
                  </div>
                </div>

                {team.shared_repos && team.shared_repos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Shared repositories</p>
                    <div className="mt-2 space-y-1">
                      {team.shared_repos.map((r) => (
                        <a
                          key={r.id}
                          href={`/dashboard/repositories/${r.id}`}
                          className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                        >
                          <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                          <span>{r.name}</span>
                          <span className={`ml-auto rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                            r.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                            r.status === "error" ? "bg-red-50 text-red-700" :
                            "bg-blue-50 text-blue-700"
                          }`}>{r.status}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {members.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600">{m.email || m.user_id.slice(0, 8)}</span>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                            m.role === "owner" ? "bg-blue-50 text-blue-700" :
                            m.role === "admin" ? "bg-purple-50 text-purple-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {m.role}
                          </span>
                        </div>
                        {currentUserId === team.owner_id && m.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(team.id, m.user_id)}
                            disabled={removing === m.user_id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {addingTo === team.id && (
                  <div className="mt-4 space-y-3 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Add member by email</span>
                      <button onClick={() => { setAddingTo(null); setAddError(""); }} className="text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as "member" | "admin")}
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    {addError && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {addError}
                      </div>
                    )}
                    <Button onClick={() => handleAddMember(team.id)} disabled={adding || !memberEmail.trim()} className="w-full">
                      {adding ? "Adding..." : "Add member"}
                    </Button>
                  </div>
                )}

                {chatTeamId === team.id && currentUserId && (
                  <TeamChat teamId={team.id} currentUserId={currentUserId} />
                )}
              </div>
            );
            })}
          </div>
        )}

        <Dialog open={showCreate} onClose={() => { setShowCreate(false); setCreateError(""); }} title="Create team" description="Create a new team to collaborate on code reviews.">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            {createError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {createError}
              </div>
            )}
            <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
              {creating ? "Creating..." : "Create team"}
            </Button>
          </div>
        </Dialog>
      </div>
    </main>
  );
}
