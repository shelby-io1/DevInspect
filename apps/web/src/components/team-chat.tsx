"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  team_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_email?: string | null;
}

export function TeamChat({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetch(`/api/v1/teams/${teamId}/messages`).then(r => r.ok && r.json()).then(data => {
      setMessages(data || []);
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [teamId]);

  useEffect(() => {
    const channel = supabase
      .channel(`team-${teamId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId, supabase]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/v1/teams/${teamId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim() }),
    });
    if (res.ok) setText("");
    setSending(false);
  }

  return (
    <div className="mt-4 rounded-md border bg-slate-50">
      <div className="flex items-center gap-2 border-b bg-white px-4 py-2.5">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Team chat</span>
      </div>

      <div className="h-64 space-y-2 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center pt-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.user_id === currentUserId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.user_id === currentUserId
                  ? "bg-blue-500 text-white"
                  : "bg-white text-slate-700 shadow-sm"
              }`}>
                {m.user_id !== currentUserId && (
                  <p className="mb-0.5 text-xs opacity-70">{m.user_email || m.user_id.slice(0, 8)}</p>
                )}
                <p>{m.message}</p>
                <p className={`mt-0.5 text-xs ${m.user_id === currentUserId ? "text-blue-100" : "text-slate-400"}`}>
                  {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t bg-white p-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          className="flex-1 rounded-md border bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
