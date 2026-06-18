"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Post, Category, categorySlug } from "@/lib/types";
import { getRankedPosts, scorePost, RANK_STYLE } from "@/lib/ranking";
import RankingCard from "@/components/ui/RankingCard";

type Props = {
  category: Category;
  posts: Post[];
  compact?: boolean;
};

export default function WeeklyRankingSection({ category, posts, compact = false }: Props) {
  const t  = useTranslations("rankings");
  const tc = useTranslations("category");

  const catName = tc(`names.${category.replace(/\s+/g, "_")}`);

  const ranked = getRankedPosts(posts, {
    period: "weekly",
    metric: "likes",
    scope:  { type: "category", category },
    limit:  compact ? 3 : 10,
  });

  if (ranked.length === 0) return null;

  return (
    <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h2
            className="text-2xl font-bold tracking-wider"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("weeklyTitle", { category: catName })}
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("weeklyLikes")}
          </span>
        </div>
        {compact && (
          <Link
            href={`/category/${categorySlug(category)}`}
            className="text-xs hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            {t("seeAll")}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {ranked.map((post, i) => (
          <div
            key={post.id}
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${i < 3 ? RANK_STYLE[i].border : "var(--border-subtle)"}` }}
          >
            <RankingCard
              post={post}
              rank={i + 1}
              score={scorePost(post, { period: "weekly", metric: "likes" })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
