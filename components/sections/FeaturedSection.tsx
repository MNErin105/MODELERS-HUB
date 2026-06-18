"use client";

import { useTranslations } from "next-intl";
import { Post } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";
import { PostBadge } from "@/components/ui/PostCard";

type Props = { posts: Post[] };

export default function FeaturedSection({ posts }: Props) {
  const t = useTranslations("featured");

  const WEEKLY_BADGES: PostBadge[] = [
    { emoji: "🥇", label: t("badge_weekly1"), color: "#c8a96e" },
    { emoji: "🥈", label: t("badge_weekly2"), color: "#9e9e9e" },
    { emoji: "🥉", label: t("badge_weekly3"), color: "#cd7f32" },
  ];
  const FEATURED_BADGE: PostBadge = {
    emoji: "🏆",
    label: t("badge_featured"),
    color: "var(--accent-primary)",
  };

  const featured = [...posts]
    .sort((a, b) => (b.saveCount + b.likeCount) - (a.saveCount + a.likeCount))
    .slice(0, 8);

  const weeklyRankMap = new Map(
    [...posts]
      .sort((a, b) => b.weeklyLikeCount - a.weeklyLikeCount)
      .slice(0, 3)
      .map((p, i) => [p.id, i])
  );

  const badgeMap: Record<string, PostBadge> = {};
  for (const post of featured) {
    const weeklyRank = weeklyRankMap.get(post.id);
    badgeMap[post.id] =
      weeklyRank !== undefined ? WEEKLY_BADGES[weeklyRank] : FEATURED_BADGE;
  }

  return (
    <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
          >
            {t("title")}
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("subtitle")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <span className="flex items-center gap-1"><span style={{ color: "#c8a96e" }}>🥇🥈🥉</span> {t("weeklyRankLegend")}</span>
          <span className="flex items-center gap-1"><span style={{ color: "var(--accent-primary)" }}>🏆</span> {t("featuredLegend")}</span>
        </div>
      </div>
      <WorkGrid posts={featured} badgeMap={badgeMap} />
    </section>
  );
}
