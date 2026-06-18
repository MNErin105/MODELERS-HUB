"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { posts } from "@/lib/dummy-data";
import { Category } from "@/lib/types";
import FeaturedSection from "./FeaturedSection";
import PopularSection from "./PopularSection";
import NewArrivalsSection from "./NewArrivalsSection";
import AllCategoryRankings from "./AllCategoryRankings";
import WorkGrid from "@/components/ui/WorkGrid";
import CategoryFilter from "@/components/ui/CategoryFilter";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory) result = result.filter((p) => p.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.kit.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, query]);

  const isFiltered = !!query.trim() || activeCategory !== null;

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Category filter bar */}
      <div className="py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </div>

      {isFiltered ? (
        /* Filtered results */
        <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
            {query && <> for &ldquo;{query}&rdquo;</>}
            {activeCategory && <> in <strong style={{ color: "var(--accent-primary)" }}>{activeCategory}</strong></>}
          </p>
          <WorkGrid posts={filteredPosts} />
        </section>
      ) : (
        <>
          <FeaturedSection posts={posts} />
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <PopularSection posts={posts} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <AllCategoryRankings posts={posts} />
          </div>
          <NewArrivalsSection posts={posts} />
        </>
      )}
    </div>
  );
}
