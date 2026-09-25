"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Quote, Search, Sparkles, X } from "lucide-react";
import type { BeaEvidence, BeaReply, BeaTrace } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import { timeAgo } from "@/lib/time";

function EvidenceCard({ item, number, highlighted }: { item: BeaEvidence; number: number; highlighted: boolean }) {
  const color = item.post ? getHobbyColor(item.post.hobby.name) : "#D97706";
  return (
    <Link
      id={`bea-evidence-${item.chunk_id}`}
      href={`/posts/${item.post_id}`}
      className={`flex gap-2.5 rounded-xl border p-2.5 text-sm transition-colors hover:bg-canvas ${highlighted ? "border-amber-400 bg-amber-500/5" : "border-line bg-surface"}`}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: withAlpha(color, 0.15), color }}>
        {number}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-chblack/50">
          <span className="font-semibold text-chblack/80">{item.author_name}</span>
          {item.kind === "comment" ? " replying to a post" : " in a post"}
          {item.created_at && ` · ${timeAgo(item.created_at)}`}
        </span>
        <span className="line-clamp-2 text-chblack/80">{item.text}</span>
      </span>
    </Link>
  );
}

function WhyPanel({ trace, assistant }: { trace: BeaTrace; assistant: string }) {
  const [open, setOpen] = useState(false);
  const { index, config, candidates, rewrites, generator, timings_ms } = trace;
  const signal = config.use_rerank ? "re-rank score" : "meaning score";

  return (
    <div className="mt-3 border-t border-line pt-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1 text-xs font-quick font-bold text-chblack/50 hover:text-chblack">
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} /> Why this answer?
      </button>

      {open && (
        <ol className="mt-2 space-y-3 text-xs text-chblack/70">
          <li>
            <p className="flex items-center gap-1.5 font-semibold text-chblack">
              <Search size={13} /> 1. Searched what the hive has shared
            </p>
            <p className="mt-0.5">
              {index.chunks} passages from {index.posts} posts and {index.comments} comments ({index.skipped_low_information} short reactions
              like &ldquo;Keep it up!&rdquo; and {index.skipped_duplicates} duplicates skipped). Replies are searched together with the post they
              answer. Ranking combines exact words (BM25) with meaning (embeddings).
            </p>
          </li>

          <li>
            <p className="font-semibold text-chblack">2. Best matches (used only if {signal} ≥ {config.min_relevance}, a cut-off chosen by evaluation)</p>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead className="text-[10px] uppercase tracking-wide text-chblack/40">
                  <tr>
                    <th className="py-1 pr-2 font-bold">Passage</th>
                    <th className="px-2 font-bold">Words matched</th>
                    <th className="px-2 font-bold">Meaning</th>
                    <th className="pl-2 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {candidates.slice(0, 5).map((c, i) => (
                    <tr key={i} className={c.selected ? "text-chblack" : ""}>
                      <td className="max-w-[220px] truncate py-1.5 pr-2" title={c.text}>
                        {c.author.split(" ")[0]}: {c.text}
                      </td>
                      <td className="px-2">{Object.keys(c.matched_terms).join(", ") || "—"}</td>
                      <td className="px-2 tabular-nums">{c.meaning_score.toFixed(2)}</td>
                      <td className="whitespace-nowrap pl-2">
                        {c.selected ? (
                          <span className="font-semibold text-emerald-600">used</span>
                        ) : c.is_question ? (
                          "a question, not an answer"
                        ) : !c.passed_threshold ? (
                          "below cut-off"
                        ) : !c.close_to_best ? (
                          "much weaker than the top match"
                        ) : (
                          "similar to one used"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </li>

          <li>
            <p className="font-semibold text-chblack">3. Wrote it up, then checked every sentence</p>
            {rewrites.length === 0 ? (
              <p className="mt-0.5">Nothing cleared the cut-off, so {assistant} said so instead of guessing.</p>
            ) : (
              <ul className="mt-1 space-y-1.5">
                {rewrites.map((r, i) => (
                  <li key={i} className="rounded-lg bg-surface p-2">
                    <p className="text-chblack/55">&ldquo;{r.source}&rdquo;</p>
                    {r.draft && <p className="mt-0.5">→ &ldquo;{r.draft}&rdquo;</p>}
                    <p className={`mt-0.5 flex items-center gap-1 font-semibold ${r.accepted ? "text-emerald-600" : "text-chblack/60"}`}>
                      {r.accepted ? <Check size={12} /> : r.draft ? <X size={12} /> : <Quote size={12} />}
                      {r.accepted
                        ? "Rewrite kept: every word traces back to the original"
                        : r.draft
                          ? `Rewrite rejected (${r.reason}${r.unsupported_words.length ? `: added ${r.unsupported_words.join(", ")}` : ""}${
                              r.reason === "dropped key details" ? `: dropped ${r.dropped_words.join(", ")}` : ""
                            }), so it's quoted instead`
                          : `Quoted as written (${r.reason})`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li className="flex flex-wrap gap-x-3 text-[11px] text-chblack/45">
            <span className="flex items-center gap-1">
              <Sparkles size={11} /> local language model: {generator}
            </span>
            <span>total {Math.round(timings_ms.total_ms ?? 0)} ms</span>
            <span>no data left the server</span>
          </li>
        </ol>
      )}
    </div>
  );
}

/** Bea's reply: the answer (with numbered evidence markers), the evidence cards, and the "Why this answer?" trace. */
function BeaAnswer({ reply }: { reply: BeaReply }) {
  const [highlight, setHighlight] = useState<string | null>(null);

  if (!reply.available) {
    return (
      <div>
        <p>{reply.assistant} can&apos;t look through the hive right now. Please try again in a bit.</p>
        <p className="mt-1 text-xs text-chblack/45">Developer note: the ML service (apps/ml, port 8002) isn&apos;t reachable.</p>
      </div>
    );
  }

  const evidence = reply.evidence ?? [];
  const jumpTo = (item: BeaEvidence) => {
    setHighlight(item.chunk_id);
    document.getElementById(`bea-evidence-${item.chunk_id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div>
      <p className="leading-relaxed">
        {(reply.answer ?? []).map((seg, k) => (
          <span key={k}>
            {seg.text.trimEnd()}
            {seg.evidence.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => jumpTo(evidence[i])}
                className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-1 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[10px] font-bold text-amber-700 hover:bg-amber-500/30 dark:text-amber-300"
                aria-label={`Evidence ${i + 1}: ${evidence[i]?.author_name}`}
              >
                {i + 1}
              </button>
            ))}{" "}
          </span>
        ))}
      </p>

      {evidence.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/40">From the hive</p>
          {evidence.map((item, i) => (
            <EvidenceCard key={item.chunk_id} item={item} number={i + 1} highlighted={highlight === item.chunk_id} />
          ))}
        </div>
      )}

      {reply.trace && <WhyPanel trace={reply.trace} assistant={reply.assistant} />}
    </div>
  );
}

export default BeaAnswer;
