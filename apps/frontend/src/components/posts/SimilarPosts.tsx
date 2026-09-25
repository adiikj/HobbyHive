"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSimilarPosts, type Post } from "@/api/api";
import { getHobbyColor } from "@/lib/hobbyTheme";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import Skeleton from "@/components/ui/Skeleton";

/** "More like this": nearest neighbours by post embedding. Renders nothing if there are none (or ML is off). */
function SimilarPosts({ postId }: { postId: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    getSimilarPosts(postId)
      .then((p) => !cancelled && setPosts(p))
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (posts !== null && posts.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-quick font-bold uppercase tracking-wider text-chblack/45">
        <Sparkles size={13} /> More like this
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {posts === null
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl bg-line" />)
          : posts.map((p) => {
              const color = getHobbyColor(p.hobby.name);
              const image = p.images?.[0] ?? p.imageUrl;
              return (
                <Link key={p.id} href={`/posts/${p.id}`} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:bg-canvas">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[11px] font-quick font-bold" style={{ color }}>
                      <HobbyGlyph color={color} size={9} /> {p.hobby.name} · {p.author.name}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-chblack/80">{p.content}</span>
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

export default SimilarPosts;
