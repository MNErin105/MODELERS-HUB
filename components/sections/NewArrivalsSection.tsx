"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, Category, Post } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";
import SectionCategoryFilter from "@/components/ui/SectionCategoryFilter";

const PAGE_SIZE = 8;

type Props = { posts: Post[]; categories?: Category[] };

export default function NewArrivalsSection({ posts, categories }: Props) {
  const [page, setPage] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const allCategories = categories ?? CATEGORIES;

  const sorted = useMemo(() => {
    let result = [...posts];
    if (activeCategory) result = result.filter((p) => p.category === activeCategory);
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [posts, activeCategory]);

  function handleCategoryChange(cat: Category | null) {
    setActiveCategory(cat);
    setPage(0);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pagePosts  = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <div className="flex items-baseline gap-4 shrink-0">
          <h2 className="section-heading">New Arrivals</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            latest posts
          </span>
        </div>
        <SectionCategoryFilter
          categories={allCategories}
          active={activeCategory}
          onChange={handleCategoryChange}
        />
      </div>

      <WorkGrid posts={pagePosts} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
            style={{
              background: "var(--bg-secondary)",
              color:      "var(--text-secondary)",
              border:     "1px solid var(--border-subtle)",
            }}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span
            className="text-sm tabular-nums select-none"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: "4rem", textAlign: "center" }}
          >
            {safePage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
            style={{
              background: "var(--bg-secondary)",
              color:      "var(--text-secondary)",
              border:     "1px solid var(--border-subtle)",
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
