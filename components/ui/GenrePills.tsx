"use client";

import { useTranslations } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";

type Props = {
  active: Category | null;
  onChange: (genre: Category | null) => void;
  className?: string;
};

// Pill-style genre filter used inside width-constrained containers (the
// /build-logs feed, profile tabs). CategoryFilter.tsx is the full-bleed
// variant for home sections and carries its own page-width wrapper.
export default function GenrePills({ active, onChange, className = "flex flex-wrap gap-2" }: Props) {
  const tc = useTranslations("category");

  return (
    <div className={className}>
      <button
        onClick={() => onChange(null)}
        className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
        style={{
          background: active === null ? "var(--accent-primary)" : "var(--bg-secondary)",
          color:      active === null ? "var(--bg-primary)"     : "var(--text-secondary)",
          border:     `1px solid ${active === null ? "var(--accent-primary)" : "var(--border-subtle)"}`,
        }}
      >
        {tc("all")}
      </button>
      {CATEGORIES.map((cat) => {
        const selected = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(selected ? null : cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: selected ? "var(--accent-primary)" : "var(--bg-secondary)",
              color:      selected ? "var(--bg-primary)"     : "var(--text-secondary)",
              border:     `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
            }}
          >
            {tc(`names.${cat.replace(/\s+/g, "_")}`)}
          </button>
        );
      })}
    </div>
  );
}
