"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/context/AppContext";

type Props = {
  authorId: string;
  followersCount: number;
};

export default function FollowButton({ authorId, followersCount }: Props) {
  const { followedIds, toggleFollow } = useApp();
  const followed = followedIds.has(authorId);
  const [animate, setAnimate] = useState(false);
  const t = useTranslations("follow");

  function handleClick() {
    toggleFollow(authorId);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 200);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={followed ? t("following") : t("follow")}
      className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
      style={{
        background: followed ? "var(--bg-tertiary)" : "var(--accent-primary)",
        color: followed ? "var(--text-secondary)" : "var(--bg-primary)",
        border: followed ? "1px solid var(--border-muted)" : "1px solid transparent",
        transform: animate ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.15s ease, background 0.2s ease",
      }}
    >
      {followed ? t("following") : t("follow")}
      <span className="ml-2 text-xs opacity-70">
        {followersCount + (followed ? 1 : 0)}
      </span>
    </button>
  );
}
