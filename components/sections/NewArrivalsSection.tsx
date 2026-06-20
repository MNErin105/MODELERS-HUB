"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Post } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";

const PAGE_SIZE = 8;

type Props = { posts: Post[] };

export default function NewArrivalsSection({ posts }: Props) {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      [...posts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [posts],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pagePosts  = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="section-heading">New Arrivals</h2>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          latest posts
        </span>
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
