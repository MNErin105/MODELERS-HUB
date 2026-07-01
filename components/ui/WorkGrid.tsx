"use client";

import { useTranslations } from "next-intl";
import { Post } from "@/lib/types";
import PostCard, { PostBadge } from "./PostCard";

type Props = {
  posts: Post[];
  badgeMap?: Record<string, PostBadge>;
  emptyMessage?: string;
  pinnedIds?: Set<string>;
  onTogglePin?: (postId: string) => void;
};

export default function WorkGrid({ posts, badgeMap, emptyMessage, pinnedIds, onTogglePin }: Props) {
  const t = useTranslations("workGrid");
  const empty = emptyMessage ?? t("empty");

  if (posts.length === 0) {
    return (
      <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
        {empty}
      </p>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4" style={{ columnGap: "10px" }}>
      {posts.map((post) => (
        <div key={post.id} className="break-inside-avoid mb-[10px]">
          <PostCard
            post={post}
            badge={badgeMap?.[post.id]}
            isPinned={pinnedIds?.has(post.id)}
            onTogglePin={onTogglePin ? (e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(post.id); } : undefined}

          />
        </div>
      ))}
    </div>
  );
}
