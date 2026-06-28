"use client";

import dynamic from "next/dynamic";

const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false });

export default function ChatPanelWrapper({
  repositoryId,
  files
}: {
  repositoryId: string;
  files: { path: string; content: string }[];
}) {
  return <ChatPanel repositoryId={repositoryId} files={files} />;
}
