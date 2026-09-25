"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { askBea, type BeaReply } from "@/api/api";
import BeaAvatar from "./BeaAvatar";
import BeaAnswer from "./BeaAnswer";

const STARTERS = [
  "What do beginners here struggle with most?",
  "Any tips for staying consistent?",
  "What helped people improve fastest?",
];

interface Exchange {
  question: string;
  reply: BeaReply | null; // null while Bea is thinking
  error?: string;
}

interface AskBeaProps {
  hive: { name: string; slug: string };
  /** Pre-filled question (e.g. from the dashboard card), asked on mount. */
  initialQuestion?: string | null;
}

/** Chat-style Q&A with Bea, scoped to one hive. Answers come only from what members have posted. */
function AskBea({ hive, initialQuestion }: AskBeaProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const askedInitial = useRef(false);
  const isThinking = exchanges.some((e) => e.reply === null && !e.error);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || isThinking) return;
    setDraft("");
    setExchanges((prev) => [...prev, { question: q, reply: null }]);
    try {
      const reply = await askBea(q, hive.slug);
      setExchanges((prev) => prev.map((e, i) => (i === prev.length - 1 ? { ...e, reply } : e)));
    } catch (err) {
      const error = err instanceof Error ? err.message : "Something went wrong";
      setExchanges((prev) => prev.map((e, i) => (i === prev.length - 1 ? { ...e, error } : e)));
    }
  };

  useEffect(() => {
    if (initialQuestion && !askedInitial.current) {
      askedInitial.current = true;
      ask(initialQuestion);
    }
    // ask once on mount for a pre-filled question
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [exchanges]);

  const bubble = "max-w-[88%] rounded-2xl px-4 py-2.5 text-sm";

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <BeaAvatar size={40} />
        <div className="min-w-0">
          <p className="font-semibold text-chblack">Bea</p>
          <p className="truncate text-xs text-chblack/50">Answers only from what the {hive.name} hive has shared, and shows her working.</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {exchanges.length === 0 && (
          <div className="flex gap-2.5">
            <BeaAvatar size={28} />
            <div className={`${bubble} rounded-tl-md bg-canvas text-chblack`}>
              Hey! I&apos;ve read what people have posted in {hive.name}. Ask me what&apos;s worked for them. I&apos;ll point you to the posts, and if nobody&apos;s talked about it yet, I&apos;ll say so.
            </div>
          </div>
        )}

        {exchanges.map((e, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex justify-end">
              <div className={`${bubble} rounded-tr-md bg-brand text-white`}>{e.question}</div>
            </div>
            <div className="flex gap-2.5">
              <BeaAvatar size={28} />
              <div className={`${bubble} rounded-tl-md bg-canvas text-chblack`}>
                {e.error ? (
                  <p>{e.error}</p>
                ) : e.reply ? (
                  <BeaAnswer reply={e.reply} />
                ) : (
                  <p className="flex items-center gap-2 text-chblack/55">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </span>
                    Looking through what the {hive.name} hive has shared…
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />

        {exchanges.length === 0 && (
          <div className="flex flex-wrap gap-2 pl-9">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-quick font-bold text-chblack/65 transition-colors hover:border-amber-400 hover:text-chblack"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask Bea about ${hive.name}…`}
          aria-label="Ask Bea a question"
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isThinking}
          aria-label="Ask"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[#3b2a06] transition-opacity hover:bg-amber-400 disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}

export default AskBea;
