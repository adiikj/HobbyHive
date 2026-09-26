"use client";

import { Heart, MessageCircle } from "lucide-react";
import type { Post } from "@/api/api";
import { getHobbyColor } from "@/lib/hobbyTheme";
import HobbyIcon from "@/components/brand/HobbyIcon";

interface PhotoGridProps {
  posts: Post[];
  onOpen: (post: Post) => void;
}

/** Instagram-Explore-style mosaic: 3 columns, and every 10th tile (starting with the first) spans 2×2. */
function PhotoGrid({ posts, onOpen }: PhotoGridProps) {
  return (
    <div className="grid grid-flow-dense grid-cols-3 gap-1 overflow-hidden rounded-2xl sm:gap-1.5">
      {posts.map((post, i) => {
        const isFeature = i % 10 === 0;
        const color = getHobbyColor(post.hobby.name);
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onOpen(post)}
            aria-label={`Open ${post.author.name}'s ${post.hobby.name} post`}
            className={`group relative aspect-square overflow-hidden bg-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand ${
              isFeature ? "col-span-2 row-span-2" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl!}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-quick font-bold text-white backdrop-blur">
              <HobbyIcon name={post.hobby.name} size={12} style={{ color }} /> {post.hobby.name}
            </span>
            <span className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="flex items-center gap-1.5">
                <Heart size={18} fill="currentColor" /> {post.likesCount}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={18} fill="currentColor" /> {post.commentsCount}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default PhotoGrid;
