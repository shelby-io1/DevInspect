"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
}

export function ShareRepoPanel({ repoId, teams, currentTeamId }: { repoId: string; teams: Team[]; currentTeamId: string | null }) {
  const [teamId, setTeamId] = useState(currentTeamId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleShare() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/v1/repositories/${repoId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId || null }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (teams.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Share with team</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Allow your team members to view this repository and its analyses.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full max-w-xs rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Not shared</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Button onClick={handleShare} disabled={saving} size="sm">
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}
