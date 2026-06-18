"use client";

import { useTranslations } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";

type Props = {
  active: Category | null;
  onChange: (cat: Category | null) => void;
};

export default function CategoryFilter({ active, onChange }: Props) {
  const tc = useTranslations("category");

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex gap-2 min-w-max px-6 max-w-[1440px] mx-auto">
        <button
          onClick={() => onChange(null)}
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          style={{
            background: active === null ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: active === null ? "var(--bg-primary)" : "var(--text-secondary)",
            border: `1px solid ${active === null ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          }}
        >
          {tc("all")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat === active ? null : cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: active === cat ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: active === cat ? "var(--bg-primary)" : "var(--text-secondary)",
              border: `1px solid ${active === cat ? "var(--accent-primary)" : "var(--border-subtle)"}`,
            }}
          >
            {tc(`names.${cat.replace(/\s+/g, "_")}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
