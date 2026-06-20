"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/context/AuthContext";

type Props = {
  postId: string;
  count: number;
};

export default function LikeButton({ postId, count }: Props) {
  const { likedIds, toggleLike } = useApp();
  const { user, openLoginModal } = useAuth();
  const liked = likedIds.has(postId);
  const [animate, setAnimate] = useState(false);
  // Tracks in-session changes so the displayed count stays consistent
  // regardless of what the DB count already includes.
  const [localDelta, setLocalDelta] = useState(0);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openLoginModal(); return; }
    setLocalDelta((d) => (liked ? d - 1 : d + 1));
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
    await toggleLike(postId);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={liked ? "Unlike this work" : "Like this work"}
      className="flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1"
      style={{
        color: liked ? "var(--color-like)" : "var(--text-secondary)",
        transform: animate ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.15s ease, color 0.15s ease",
      }}
    >
      <Heart size={14} fill={liked ? "currentColor" : "none"} strokeWidth={2} />
      <span>{count + localDelta}</span>
    </button>
  );
}
