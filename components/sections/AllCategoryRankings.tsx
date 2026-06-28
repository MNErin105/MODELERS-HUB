"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Post, Category, CATEGORIES, CATEGORY_META, categorySlug } from "@/lib/types";
import { getRankedPosts, scorePost, RankingPeriod } from "@/lib/ranking";
import PodiumRankCard from "@/components/ui/PodiumRankCard";
import { Trophy } from "lucide-react";

const CATEGORY_ICONS: Record<Category, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.icon])
) as Record<Category, string>;

// Period selector — weekly is live, others show "coming soon"
const PERIODS: { id: RankingPeriod; available: boolean }[] = [
  { id: "weekly",  available: true  },
  { id: "monthly", available: false },
  { id: "yearly",  available: false },
];

type Props = { posts: Post[] };

export default function AllCategoryRankings({ posts }: Props) {
  const t  = useTranslations("rankings");
  const tc = useTranslations("category");
  const [activeCategory, setActiveCategory] = useState<Category>("Gunpla");
  const [activePeriod, setActivePeriod]     = useState<RankingPeriod>("weekly");

  const catName  = (cat: Category) => tc(`names.${cat.replace(/\s+/g, "_")}`);
  const period   = t(`periods.${activePeriod}`);

  const ranked = getRankedPosts(posts, {
    period: activePeriod,
    metric: "likes",
    scope:  { type: "category", category: activeCategory },
    limit:  3,
  });

  const [first, second, third] = ranked;
  const hasEnough = ranked.length >= 2;

  return (
    <section className="w-full py-12 px-6 max-w-[1440px] mx-auto">

      {/* ── Section header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Trophy size={22} style={{ color: "var(--accent-primary)" }} />
          <h2 className="section-heading">{t("title")}</h2>
        </div>

        {/* Period selector */}
        <div
          className="flex items-center rounded-lg overflow-hidden text-xs font-semibold"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          {PERIODS.map(({ id, available }) => (
            <button
              key={id}
              onClick={() => available && setActivePeriod(id)}
              disabled={!available}
              title={available ? undefined : "Coming soon"}
              className="px-3 py-1.5 transition-colors relative capitalize"
              style={{
                background: activePeriod === id ? "var(--accent-muted)" : "var(--bg-secondary)",
                color: activePeriod === id
                  ? "var(--accent-primary)"
                  : available ? "var(--text-secondary)" : "var(--text-muted)",
                cursor: available ? "pointer" : "not-allowed",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t(`periods.${id}`)}
              {!available && (
                <span
                  className="absolute -top-1 -right-1 text-[9px] px-1 rounded"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                >
                  {t("comingSoon")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category tab bar ────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-1 mb-8 -mx-6 px-6">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const count = posts.filter((p) => p.categories.includes(cat)).length;
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "var(--accent-primary)" : "var(--bg-secondary)",
                  color:      isActive ? "var(--bg-primary)"     : "var(--text-secondary)",
                  border:     `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{catName(cat)}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                  style={{
                    background: isActive ? "rgba(10,10,11,0.25)" : "var(--bg-tertiary)",
                    color:      isActive ? "var(--bg-primary)"   : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Podium ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-5">
          <h3
            className="text-xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("rankingTitle", { icon: CATEGORY_ICONS[activeCategory], category: catName(activeCategory), period })}
          </h3>
          <Link
            href={`/category/${categorySlug(activeCategory)}`}
            className="text-xs hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            {t("viewAll", { category: catName(activeCategory) })}
          </Link>
        </div>

        {ranked.length === 0 ? (
          <EmptyRanking category={activeCategory} />
        ) : !hasEnough ? (
          <div>
            {/* Only 1 post — show it large */}
            <div className="max-w-2xl">
              {first && (
                <PodiumRankCard
                  post={first}
                  rank={0}
                  score={scorePost(first, { period: activePeriod, metric: "likes" })}
                  size="large"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 1st place — full width */}
            {first && (
              <PodiumRankCard
                post={first}
                rank={0}
                score={scorePost(first, { period: activePeriod, metric: "likes" })}
                size="large"
              />
            )}

            {/* 2nd & 3rd — side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {second && (
                <PodiumRankCard
                  post={second}
                  rank={1}
                  score={scorePost(second, { period: activePeriod, metric: "likes" })}
                  size="small"
                />
              )}
              {third && (
                <PodiumRankCard
                  post={third}
                  rank={2}
                  score={scorePost(third, { period: activePeriod, metric: "likes" })}
                  size="small"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyRanking({ category }: { category: Category }) {
  const t  = useTranslations("rankings");
  const tc = useTranslations("category");
  const name = tc(`names.${category.replace(/\s+/g, "_")}`);
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-2xl gap-3 text-center"
      style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border-muted)" }}
    >
      <span className="text-4xl">{CATEGORY_ICONS[category]}</span>
      <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
        {t("noWorksTitle", { category: name })}
      </p>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t("noWorksSubtitle", { category: name })}
      </p>
    </div>
  );
}

