"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { useAuth } from "@/lib/context/AuthContext";

type Props = {
  postId: string;
  count: number;
};

export default function SaveButton({ postId, count }: Props) {
  const { savedIds, toggleSave } = useApp();
  const { user, openLoginModal } = useAuth();
  const saved = savedIds.has(postId);
  const [animate, setAnimate] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openLoginModal(); return; }
    toggleSave(postId);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);
  }

  const displayCount = count + (saved ? 1 : 0);

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from saved" : "Save this work"}
      className="flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1"
      style={{
        color: saved ? "var(--color-save)" : "var(--text-secondary)",
        transform: animate ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.15s ease, color 0.15s ease",
      }}
    >
      <Bookmark size={14} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
      <span>{displayCount}</span>
    </button>
  );
}
