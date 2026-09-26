"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Crosshair, Heart, Lightbulb, MessageSquareHeart, ThumbsUp, X } from "lucide-react";
import { getHiveGuide, removeFromGuide, type GuideSection, type HiveGuide as Guide } from "@/api/api";
import Skeleton from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Page";
import { withAlpha, getHobbyText } from "@/lib/hobbyTheme";
import { MentorBadge } from "@/components/posts/FeedbackThread";

const excerpt = (text: string, n = 160) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text);

function Section({ section, color, onRemoved }: { section: GuideSection; color: string; onRemoved: (entryId: string) => void }) {
  const title = section.skill?.name ?? "General";
  const count = section.curated.length + section.helpful.length + section.popular.length;

  return (
    <Card className="overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3" style={{ backgroundColor: withAlpha(color, 0.05) }}>
        <h3 className="font-bnt text-2xl leading-none text-chblack">{title.toUpperCase()}</h3>
        <span className="text-xs text-chblack/45">
          {section.skill ? `Tier ${section.skill.tier} · ` : ""}
          {count} {count === 1 ? "entry" : "entries"}
        </span>
      </header>

      <div className="space-y-4 p-4">
        {section.curated.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-quick font-bold uppercase tracking-wider" style={{ color: getHobbyText(color) }}>
              <BookOpen size={12} /> Recommended
            </p>
            <ul className="space-y-2">
              {section.curated.map((e) => (
                <li key={e.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start gap-2">
                    <Link href={`/posts/${e.post.id}`} className="min-w-0 flex-1">
                      <p className="text-sm text-chblack">{excerpt(e.post.content)}</p>
                      <p className="mt-1 text-xs text-chblack/50">
                        {e.post.author.name} · <Heart size={11} className="inline -translate-y-px" /> {e.post.likesCount}
                      </p>
                    </Link>
                    {e.canRemove && (
                      <button
                        type="button"
                        onClick={() => removeFromGuide(e.id).then(() => onRemoved(e.id)).catch(() => {})}
                        aria-label="Remove from guide"
                        title="Remove from guide"
                        className="rounded-full p-1 text-chblack/35 hover:bg-canvas hover:text-chblack"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {e.note && (
                    <p className="mt-2 rounded-lg bg-canvas px-2.5 py-1.5 text-xs text-chblack/70">
                      <span className="font-semibold text-chblack">{e.addedBy.name.split(" ")[0]}:</span> {e.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.helpful.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-quick font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <MessageSquareHeart size={12} /> Feedback that helped
            </p>
            <ul className="space-y-2">
              {section.helpful.map((f) => (
                <li key={f.id}>
                  <Link href={`/posts/${f.post.id}#feedback`} className="block rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3 transition-colors hover:bg-emerald-500/[0.08]">
                    {f.post.ask && (
                      <p className="text-xs text-chblack/55">
                        <span className="font-semibold text-chblack/70">{f.post.author.name.split(" ")[0]} asked:</span> {f.post.ask}
                      </p>
                    )}
                    <p className="mt-1.5 flex gap-2 text-sm text-chblack/85">
                      <ThumbsUp size={13} className="mt-0.5 shrink-0 text-emerald-600" aria-label="What's working" /> {f.working}
                    </p>
                    <p className="mt-1 flex gap-2 text-sm text-chblack/85">
                      <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-500" aria-label="One thing to try" /> {f.tryNext}
                    </p>
                    {f.at && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-chblack/60">
                        <Crosshair size={12} className="shrink-0 text-sky-500" aria-label="Where to look" /> {f.at}
                      </p>
                    )}
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-chblack/50">
                      from {f.author.name}
                      {f.mentorLevel && <MentorBadge level={f.mentorLevel} />}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.popular.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-quick font-bold uppercase tracking-wider text-chblack/45">
              <Heart size={12} /> Popular in the hive
            </p>
            <ul className="space-y-2">
              {section.popular.map((p) => (
                <li key={p.id}>
                  <Link href={`/posts/${p.id}`} className="block rounded-xl border border-line p-3 transition-colors hover:bg-canvas">
                    <p className="text-sm text-chblack">{excerpt(p.content)}</p>
                    <p className="mt-1 text-xs text-chblack/50">
                      {p.author.name} · <Heart size={11} className="inline -translate-y-px" /> {p.likesCount}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/** The hive's living guide, built from what members found helpful and what moderators and mentors recommend. */
function HiveGuide({ slug, hobbyName, color }: { slug: string; hobbyName: string; color: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setGuide(null);
    getHiveGuide(slug)
      .then((g) => !cancelled && setGuide(g))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load the guide"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const removed = (entryId: string) =>
    setGuide((g) => (g ? { ...g, sections: g.sections.map((s) => ({ ...s, curated: s.curated.filter((e) => e.id !== entryId) })) } : g));

  if (error) return <Card className="p-6 text-center text-sm text-red-600">{error}</Card>;
  if (!guide) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-20 w-full rounded-2xl bg-line" />
        <Skeleton className="h-48 w-full rounded-2xl bg-line" />
      </div>
    );
  }

  const sections = guide.sections.filter((s) => s.curated.length + s.helpful.length + s.popular.length > 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="flex items-center gap-2 font-bnt text-2xl leading-none text-chblack">
          <BookOpen size={18} style={{ color: getHobbyText(color) }} /> THE {hobbyName.toUpperCase()} GUIDE
        </p>
        <p className="mt-1.5 text-sm text-chblack/65">
          Written by the hive: feedback people found helpful, the posts members liked most, and picks from moderators and mentors, sorted by skill.
          {guide.canCurate
            ? " You can add posts from their ••• menu."
            : " Moderators and members with 3+ helpful answers can add posts."}
        </p>
      </Card>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <p className="font-bnt text-3xl" style={{ color: getHobbyText(color) }}>
            NOTHING HERE YET
          </p>
          <p className="mt-1 text-sm text-chblack/60">The guide fills up as people give feedback that helps, and as mentors pick the best posts.</p>
          <Link href={`/hobbies/${slug}?tab=feedback`} className="mt-4 inline-block text-sm font-quick font-bold hover:underline" style={{ color: getHobbyText(color) }}>
            Answer a feedback request →
          </Link>
        </div>
      ) : (
        <>
          <nav aria-label="Guide sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {sections.map((s) => (
              <a
                key={s.skill?.id ?? "general"}
                href={`#guide-${s.skill?.id ?? "general"}`}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-quick font-bold"
                style={{ borderColor: withAlpha(color, 0.3), color }}
              >
                {s.skill?.name ?? "General"}
              </a>
            ))}
          </nav>
          {sections.map((s) => (
            <div key={s.skill?.id ?? "general"} id={`guide-${s.skill?.id ?? "general"}`} className="scroll-mt-20">
              <Section section={s} color={color} onRemoved={removed} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default HiveGuide;
