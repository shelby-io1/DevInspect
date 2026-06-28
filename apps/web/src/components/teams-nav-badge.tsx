"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TeamsNavBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const res = await fetch("/api/v1/teams");
      if (!res.ok) return;
      const teams = await res.json();

      let total = 0;
      for (const t of teams) {
        if (!t.last_message_created_at) continue;
        const key = `chat_read:${t.id}:${user.id}`;
        const lastRead = localStorage.getItem(key);
        if (!lastRead || new Date(t.last_message_created_at) > new Date(lastRead)) {
          total++;
        }
      }
      if (!cancelled) setCount(total);
    }

    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
