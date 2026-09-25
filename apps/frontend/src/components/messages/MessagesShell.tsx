"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import MessagesList from "./MessagesList";

function MessagesShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const activeConversationId = segments[0] === "messages" && segments[1] ? segments[1] : null;
  const hasOpenConversation = Boolean(activeConversationId);

  return (
    <div className="flex h-[calc(100dvh-5rem)] lg:h-screen overflow-hidden bg-canvas">
      <div
        className={`${
          hasOpenConversation ? "hidden lg:flex" : "flex"
        } w-full lg:w-[360px] lg:border-r lg:border-line flex-col shrink-0`}
      >
        <MessagesList activeConversationId={activeConversationId} />
      </div>
      <div className={`${hasOpenConversation ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0`}>{children}</div>
    </div>
  );
}

export default MessagesShell;
