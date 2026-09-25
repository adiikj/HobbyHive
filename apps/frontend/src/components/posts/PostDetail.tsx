"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPost, type Post } from "@/api/api";
import { getHobbyColor, withAlpha } from "@/lib/hobbyTheme";
import PostCard from "@/components/dashboard/PostCard";
import SimilarPosts from "./SimilarPosts";
import HobbyGlyph from "@/components/brand/HobbyGlyph";
import { PageContainer, secondaryButtonClass } from "@/components/ui/Page";
import { PostListSkeleton } from "@/components/ui/Skeletons";

/** A single post with its comment thread open — where notifications and shared links land. */
function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    setError("");
    getPost(postId)
      .then((p) => !cancelled && setPost(p))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load this post"));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const color = post ? getHobbyColor(post.hobby.name) : "#DB2777";

  return (
    <PageContainer width="narrow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-quick font-bold text-chblack/55 transition-colors hover:text-chblack"
        >
          <ArrowLeft size={18} /> Back
        </button>
        {post && (
          <Link
            href={`/hobbies/${post.hobby.slug}`}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-quick font-bold"
            style={{ backgroundColor: withAlpha(color, 0.12), color }}
          >
            <HobbyGlyph color={color} size={10} /> {post.hobby.name} hive <ArrowUpRight size={13} />
          </Link>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-12 text-center">
          <p className="font-bnt text-4xl text-chblack">POST NOT FOUND</p>
          <p className="mt-1 text-sm text-chblack/55">It may have been deleted.</p>
          <Link href="/dashboard" className={`${secondaryButtonClass} mt-5`}>
            Back to your feed
          </Link>
        </div>
      ) : !post ? (
        <PostListSkeleton count={1} />
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface">
            <PostCard post={post} autoOpenComments />
          </div>
          <SimilarPosts postId={post.id} />
        </>
      )}
    </PageContainer>
  );
}

export default PostDetail;
