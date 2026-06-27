"use client";

import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";

type Props = {
  active: Category | null;
  onChange: (cat: Category | null) => void;
  order?: Category[];
  onReorderClick?: () => void;
};

export default function CategoryFilter({ active, onChange, order, onReorderClick }: Props) {
  const tc = useTranslations("category");
  const to = useTranslations("categoryOrder");
  const categories = order ?? CATEGORIES;

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

        {categories.map((cat) => (
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

        {onReorderClick && (
          <button
            onClick={onReorderClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:opacity-80"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
            title={to("modalTitle")}
          >
            <Settings2 size={13} />
            {to("button")}
          </button>
        )}
      </div>
    </div>
  );
}
