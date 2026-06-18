"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Post, Category, CATEGORIES, CATEGORY_META, categorySlug } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";
import WeeklyRankingSection from "@/components/sections/WeeklyRankingSection";
import { ChevronLeft } from "lucide-react";

type Props = {
  category: Category;
  categoryPosts: Post[];
  allPosts: Post[];
};

export default function CategoryPageClient({ category, categoryPosts, allPosts }: Props) {
  const tc = useTranslations("category");
  const catKey = category.replace(/\s+/g, "_") as Parameters<typeof tc>[0];
  const catName = tc(`names.${catKey}`);
  const catDesc = tc(`descriptions.${catKey}`);
  const meta = CATEGORY_META[category];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={16} /> {tc("backToArchive")}
        </Link>

        {/* Category header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{meta.icon}</span>
            <h1
              className="text-4xl font-bold tracking-widest"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {catName.toUpperCase()}
            </h1>
          </div>
          <p className="text-sm mb-2" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {catDesc}
          </p>
          {meta.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {meta.subcategories.map((sub) => (
                <span
                  key={sub}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {tc("worksCount", { count: categoryPosts.length })}
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/category/${categorySlug(cat)}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: cat === category ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: cat === category ? "var(--bg-primary)" : "var(--text-secondary)",
                border: `1px solid ${cat === category ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}
            >
              {tc(`names.${cat.replace(/\s+/g, "_")}`)}
            </Link>
          ))}
        </div>

        {/* Weekly ranking for this category */}
        {categoryPosts.length >= 1 && (
          <div className="mb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <WeeklyRankingSection category={category} posts={allPosts} />
          </div>
        )}

        {/* All posts in category */}
        <div className="py-10">
          <h2
            className="text-2xl font-bold tracking-wider mb-6"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {tc("allWorksTitle", { category: catName.toUpperCase() })}
          </h2>
          <WorkGrid
            posts={[...categoryPosts].sort((a, b) => b.saveCount - a.saveCount)}
            emptyMessage={tc("noWorks")}
          />
        </div>
      </div>
    </div>
  );
}
