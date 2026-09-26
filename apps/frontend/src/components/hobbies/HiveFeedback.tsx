"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, MessageSquareHeart } from "lucide-react";
import { getFeedbackRequests, getHiveMentors, type MentorLevel, type Post } from "@/api/api";
import PostCard from "@/components/dashboard/PostCard";
import { PostListSkeleton } from "@/components/ui/Skeletons";
import { Card } from "@/components/ui/Page";
import { withAlpha, getHobbyText } from "@/lib/hobbyTheme";
import { MentorBadge } from "@/components/posts/FeedbackThread";

type Mentor = { user: { id: string; name: string; username: string; avatarUrl: string | null }; helpful: number; level: MentorLevel | null };

/** A hive's feedback requests (unanswered first by default) and the members whose feedback helps most. */
function HiveFeedback({ slug, hobbyName, color }: { slug: string; hobbyName: string; color: string }) {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    getFeedbackRequests(slug, onlyOpen)
      .then((p) => !cancelled && setPosts(p))
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, [slug, onlyOpen]);

  useEffect(() => {
    getHiveMentors(slug).then(setMentors).catch(() => setMentors([]));
  }, [slug]);

  const toggle = (open: boolean, label: string) => (
    <button
      type="button"
      onClick={() => setOnlyOpen(open)}
      aria-pressed={onlyOpen === open}
      className={`rounded-full px-3.5 py-1.5 text-sm font-quick font-bold transition-colors ${onlyOpen === open ? "bg-chblack text-canvas" : "text-chblack/55 hover:text-chblack"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="flex items-center gap-2 text-sm text-chblack/70">
          <MessageSquareHeart size={16} className="shrink-0 text-emerald-600" />
          People asking for feedback on something specific. Answer with what&apos;s working and one thing to try; when it helps, it counts towards mentor status.
        </p>
        {mentors.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-quick font-bold uppercase tracking-[0.14em]" style={{ color: getHobbyText(color) }}>
              <Award size={13} /> Most helpful in {hobbyName}
            </p>
            <div className="flex flex-wrap gap-2">
              {mentors.map((m) => (
                <Link
                  key={m.user.id}
                  href={`/profile/${m.user.username}`}
                  className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors hover:bg-canvas"
                  style={{ borderColor: withAlpha(color, 0.25) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.user.avatarUrl || "/images/5.png"} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-sm font-semibold text-chblack">{m.user.name}</span>
                  {m.level && <MentorBadge level={m.level} hive={hobbyName} />}
                  <span className="text-xs text-chblack/45">{m.helpful} helpful</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-1">
        {toggle(true, "Needs feedback")}
        {toggle(false, "All requests")}
      </div>

      {!posts ? (
        <PostListSkeleton />
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <p className="font-bnt text-3xl" style={{ color: getHobbyText(color) }}>
            {onlyOpen ? "ALL CAUGHT UP" : "NO REQUESTS YET"}
          </p>
          <p className="mt-1 text-sm text-chblack/60">
            {onlyOpen ? "Every request here has feedback." : `Ask for feedback when you post in ${hobbyName}; requests show up here.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HiveFeedback;
