"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { Post, Category } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";

/**
 * A badge shown in the top-right corner of the card image.
 * Used for rank/featured differentiation instead of image size.
 */
export type PostBadge = {
  emoji: string;
  label: string;
  color: string;  // CSS color for text
};

/**
 * Aspect ratio per category.
 * Tall subjects (mecha, figures) → 4:5.
 * Wide subjects (vehicles, aircraft) → 1:1.
 * Two heights create natural masonry variation.
 */
function cardAspect(category: Category): "4/5" | "1/1" {
  if (["Gunpla", "Character Model"].includes(category)) return "4/5";
  return "1/1";
}

type Props = {
  post: Post;
  badge?: PostBadge;  // rank / featured badge (optional)
};

export default function PostCard({ post, badge }: Props) {
  const { savedIds, likedIds, toggleSave, toggleLike } = useApp();
  const saved = savedIds.has(post.id);
  const liked = likedIds.has(post.id);
  const [saveAnim, setSaveAnim] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const aspect = cardAspect(post.category);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    toggleSave(post.id);
    setSaveAnim(true); setTimeout(() => setSaveAnim(false), 300);
  }
  function handleLike(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    toggleLike(post.id);
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 300);
  }

  return (
    <div className="group">
      {/* ── Image — the whole card ──────────────────────────────── */}
      <Link
        href={`/posts/${post.id}`}
        className="block relative overflow-hidden rounded-xl"
        style={{ aspectRatio: aspect }}
      >
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Category badge — top-left, always visible */}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold z-10"
          style={{
            background:    "rgba(10,10,11,0.78)",
            color:         "var(--accent-primary)",
            fontFamily:    "var(--font-mono)",
            backdropFilter:"blur(4px)",
          }}
        >
          {post.category}
        </span>

        {/* Rank / Featured badge — top-right, only when provided */}
        {badge && (
          <span
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold z-10"
            style={{
              background:    "rgba(10,10,11,0.78)",
              color:         badge.color,
              fontFamily:    "var(--font-mono)",
              backdropFilter:"blur(4px)",
            }}
          >
            <span>{badge.emoji}</span>
            <span>{badge.label}</span>
          </span>
        )}

        {/* ── Hover overlay ──────────────────────────────────────── */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end p-3
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.45) 50%, transparent 80%)",
          }}
        >
          <p
            className="text-sm font-bold leading-snug mb-2"
            style={{
              color:           "var(--text-primary)",
              display:         "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow:        "hidden",
            }}
          >
            {post.title}
          </p>

          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
              <Image src={post.author.avatarUrl} alt={post.author.name} fill className="object-cover" sizes="20px" />
            </div>
            <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
              {post.author.name}
            </span>
            <button onClick={handleSave} aria-label={saved ? "Remove from saved" : "Save"}
              className="flex items-center gap-0.5 text-xs"
              style={{ color: saved ? "var(--color-save)" : "rgba(240,240,244,0.75)", transform: saveAnim ? "scale(1.4)" : "scale(1)", transition: "transform 0.15s ease, color 0.15s ease" }}>
              <Bookmark size={12} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
              <span>{post.saveCount + (saved ? 1 : 0)}</span>
            </button>
            <button onClick={handleLike} aria-label={liked ? "Unlike" : "Like"}
              className="flex items-center gap-0.5 text-xs"
              style={{ color: liked ? "var(--color-like)" : "rgba(240,240,244,0.75)", transform: likeAnim ? "scale(1.4)" : "scale(1)", transition: "transform 0.15s ease, color 0.15s ease" }}>
              <Heart size={12} fill={liked ? "currentColor" : "none"} strokeWidth={2} />
              <span>{post.likeCount + (liked ? 1 : 0)}</span>
            </button>
          </div>
        </div>
      </Link>

      {/* ── Minimal below-image info (mobile / no-hover) ─────────── */}
      <div className="pt-1.5 px-0.5 pb-1">
        <p className="text-xs font-medium truncate leading-snug" style={{ color: "var(--text-secondary)" }}>
          {post.title}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
          {post.author.name}
        </p>
      </div>
    </div>
  );
}
