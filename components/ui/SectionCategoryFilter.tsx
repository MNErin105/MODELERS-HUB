"use client";

import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  active: Category | null;
  onChange: (cat: Category | null) => void;
  onReorderClick?: () => void;
};

export default function SectionCategoryFilter({ categories, active, onChange, onReorderClick }: Props) {
  const tc = useTranslations("category");
  const to = useTranslations("categoryOrder");

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 min-w-max">
        <Chip label={tc("all")} active={active === null} onClick={() => onChange(null)} />
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={tc(`names.${cat.replace(/\s+/g, "_")}`)}
            active={active === cat}
            onClick={() => onChange(cat === active ? null : cat)}
          />
        ))}
        {onReorderClick && (
          <button
            type="button"
            onClick={onReorderClick}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:opacity-80"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
            title={to("modalTitle")}
          >
            <Settings2 size={11} />
            {to("button")}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? "var(--accent-primary)" : "var(--bg-secondary)",
        color: active ? "var(--bg-primary)" : "var(--text-secondary)",
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
      }}
    >
      {label}
    </button>
  );
}
