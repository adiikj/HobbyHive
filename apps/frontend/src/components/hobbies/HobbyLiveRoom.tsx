"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SendHorizontal } from "lucide-react";
import { getHobbyRoomMessages, type HobbyRoomMessage } from "@/api/api";
import { getSocket } from "@/lib/socket";
import Skeleton from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Page";
import { useCurrentUser } from "@/lib/currentUser";

interface HobbyLiveRoomProps {
  hobbyId: string;
  slug: string;
  color: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function HobbyLiveRoom({ hobbyId, slug, color }: HobbyLiveRoomProps) {
  const { user: me } = useCurrentUser();
  const [messages, setMessages] = useState<HobbyRoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getHobbyRoomMessages(slug)
      .then((page) => setMessages(page.messages))
      .finally(() => setIsLoading(false));

    const socket = getSocket();
    if (!socket) return;

    socket.emit("hobby:join", hobbyId);

    const handleMessage = (payload: { hobbyId: string; message: HobbyRoomMessage }) => {
      if (payload.hobbyId !== hobbyId) return;
      setMessages((prev) => [...prev, payload.message]);
    };

    socket.on("hobby:message", handleMessage);

    return () => {
      socket.off("hobby:message", handleMessage);
      socket.emit("hobby:leave", hobbyId);
    };
  }, [hobbyId, slug]);

  // Keep the newest message in view — scrolls the chat box only, never the page
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;

    const socket = getSocket();
    if (!socket) {
      setError("Not connected. Refresh and try again.");
      return;
    }

    setIsSending(true);
    setError("");
    socket.emit(
      "hobby:message",
      { hobbyId, content: draft },
      (res: { error?: string }) => {
        setIsSending(false);
        if (res?.error) {
          setError(res.error);
        } else {
          setDraft("");
        }
      }
    );
  };

  return (
    <Card as="div" className="flex h-[32rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />
          <span className="relative h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        </span>
        <p className="shrink-0 text-sm font-semibold text-chblack">Live room</p>
        <p className="hidden truncate text-xs text-chblack/45 sm:block">Messages appear for everyone in the hive instantly</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}>
                <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-line" />
                <Skeleton className="h-10 w-1/2 rounded-2xl bg-line" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-bnt text-3xl text-chblack">SAY HI</p>
            <p className="mt-1 text-sm text-chblack/55">No one&apos;s said anything yet. Break the ice.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.author.id === me?.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                {!isMine && (
                  <Link href={`/profile/${m.author.username}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.author.avatarUrl || "/images/5.png"} alt={m.author.name} className="h-8 w-8 rounded-full object-cover" />
                  </Link>
                )}
                <div className={`max-w-[75%] ${isMine ? "items-end text-right" : ""} flex flex-col`}>
                  {!isMine && (
                    <Link href={`/profile/${m.author.username}`} className="mb-0.5 ml-3 text-xs font-semibold text-chblack/60 hover:underline">
                      {m.author.name}
                    </Link>
                  )}
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed ${
                      isMine ? "rounded-br-md text-white" : "rounded-bl-md border border-line bg-surface text-chblack"
                    }`}
                    style={isMine ? { backgroundColor: color } : undefined}
                  >
                    {m.content}
                  </p>
                  <span className="mx-3 mt-0.5 text-[10px] text-chblack/35">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-4 pt-2 text-xs text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the hive…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </Card>
  );
}

export default HobbyLiveRoom;
