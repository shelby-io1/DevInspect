"use client";

import { NotificationBell } from "@/components/NotificationBell";

export function HeaderClient({ email }: { email: string }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">Signed in as</p>
      <p className="text-sm font-medium">{email}</p>
    </>
  );
}

export function HeaderActions() {
  return <NotificationBell />;
}
