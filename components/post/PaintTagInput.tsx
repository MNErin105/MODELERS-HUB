"use client";

import { useRef, useState, useMemo, KeyboardEvent } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

// ── Brand data ────────────────────────────────────────────────────────────────

type BrandItem = { value: string; name: string; detail?: string };

function buildBrands(jp: boolean): {
  mrHobbyChildren: BrandItem[];
  primary: BrandItem[];
  others: BrandItem[];
} {
  return {
    mrHobbyChildren: [
      { value: "Mr. Color",            name: "Mr. Color",            detail: jp ? "ラッカー系"       : "Lacquer"      },
      { value: "Aqueous Hobby Color",  name: "Aqueous Hobby Color",  detail: jp ? "水性ホビーカラー" : "Water-based"  },
      { value: "Acrysion",             name: "Acrysion",             detail: jp ? "水性アクリジョン" : "Water-based Acrylic" },
      { value: "Gundam Color",         name: "Gundam Color" },
      { value: "Mr. Metallic Color",   name: "Mr. Metallic Color",   detail: jp ? "ミスターメタリック" : "Metallic" },
      { value: "Mr. Surfacer",         name: "Mr. Surfacer" },
    ],
    primary: [
      { value: "Tamiya",       name: "Tamiya"       },
      { value: "Gaia Notes",   name: "Gaia Notes"   },
      { value: "Army Painter", name: "Army Painter" },
      { value: "Citadel",      name: "Citadel"      },
      { value: "Vallejo",      name: "Vallejo"      },
    ],
    others: [
      { value: "Scale75",        name: "Scale75"        },
      { value: "Pro Acryl",      name: "Pro Acryl"      },
      { value: "AK Interactive", name: "AK Interactive" },
      { value: "Ammo by Mig",    name: "Ammo by Mig"    },
      { value: "Finisher's",     name: "Finisher's"     },
      { value: "Oil Paint",      name: jp ? "油彩" : "Oil Paint" },
    ],
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaintTagInput({ label, value, onChange, placeholder, max = 20 }: Props) {
  const t      = useTranslations("newPost");
  const locale = useLocale();
  const jp     = locale === "ja";

  const { mrHobbyChildren, primary, others } = useMemo(() => buildBrands(jp), [jp]);

  const allBrands = useMemo(
    () => [...mrHobbyChildren, ...primary, ...others],
    [mrHobbyChildren, primary, others],
  );

  // Map stored value → display name for chips
  const chipLabelMap = useMemo(
    () => Object.fromEntries(allBrands.map((b) => [b.value, b.name])),
    [allBrands],
  );

  const [input,         setInput]         = useState("");
  const [focused,       setFocused]       = useState(false);
  const [expandMrHobby, setExpandMrHobby] = useState(false);
  const [expandOthers,  setExpandOthers]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q           = input.toLowerCase().trim();
  const isSearching = q.length > 0;

  // Flat search results — match against name or detail
  const filtered = isSearching
    ? allBrands.filter(
        (b) =>
          !value.includes(b.value) &&
          (b.name.toLowerCase().includes(q) || (b.detail?.toLowerCase().includes(q) ?? false)),
      )
    : [];

  function add(val: string) {
    const v = val.trim();
    if (!v || value.includes(v) || value.length >= max) return;
    onChange([...value, v]);
    setInput("");
  }

  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  const showDropdown = focused && value.length < max;
  const ph           = placeholder ?? t("placeholders.paints");
  const othersLabel  = jp ? "その他" : "Others";
  const noResults    = jp ? "一致する候補がありません" : "No results";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </label>

      <div className="relative">
        {/* Chip + input */}
        <div
          className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[44px] cursor-text"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "var(--accent-muted)", color: "var(--accent-primary)" }}
            >
              {chipLabelMap[tag] ?? tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(tag); }}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={value.length === 0 ? ph : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            disabled={value.length >= max}
          />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg overflow-hidden"
            style={{
              background: "var(--bg-tertiary)",
              border:     "1px solid var(--border-subtle)",
              boxShadow:  "0 8px 24px rgba(0,0,0,0.4)",
              maxHeight:  300,
              overflowY:  "auto",
            }}
          >
            {isSearching ? (
              /* ── Flat search results ─────────────────────────────────── */
              filtered.length > 0
                ? filtered.slice(0, 10).map((b) => (
                    <BrandRow key={b.value} item={b} onSelect={() => add(b.value)} />
                  ))
                : <p
                    className="px-3 py-2.5 text-xs"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                  >
                    {noResults}
                  </p>
            ) : (
              /* ── Structured brand list ───────────────────────────────── */
              <>
                {/* Mr. Hobby expandable group */}
                <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setExpandMrHobby((v) => !v); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    <span>Mr. Hobby</span>
                    {expandMrHobby
                      ? <ChevronDown  size={14} style={{ color: "var(--text-muted)" }} />
                      : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                  </button>
                  {expandMrHobby && mrHobbyChildren
                    .filter((b) => !value.includes(b.value))
                    .map((b) => (
                      <BrandRow key={b.value} item={b} onSelect={() => add(b.value)} indent />
                    ))
                  }
                </div>

                {/* Primary brands */}
                <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {primary
                    .filter((b) => !value.includes(b.value))
                    .map((b) => (
                      <BrandRow key={b.value} item={b} onSelect={() => add(b.value)} />
                    ))
                  }
                </div>

                {/* Others collapsible section */}
                <div>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setExpandOthers((v) => !v); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-widest hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                  >
                    <span>{othersLabel}</span>
                    {expandOthers
                      ? <ChevronDown  size={12} style={{ color: "var(--text-muted)" }} />
                      : <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />}
                  </button>
                  {expandOthers && others
                    .filter((b) => !value.includes(b.value))
                    .map((b) => (
                      <BrandRow key={b.value} item={b} onSelect={() => add(b.value)} />
                    ))
                  }
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {t("tagHint")}
        {value.length >= max && <> {t("tagHintMax", { max })}</>}
      </p>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function BrandRow({
  item, onSelect, indent,
}: {
  item: BrandItem;
  onSelect: () => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={onSelect}
      className="w-full text-left py-2 text-sm hover:opacity-80 transition-opacity"
      style={{
        paddingLeft:  indent ? 28 : 12,
        paddingRight: 12,
        color:        "var(--text-secondary)",
        fontFamily:   "var(--font-mono)",
      }}
    >
      {item.name}
      {item.detail && (
        <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          ({item.detail})
        </span>
      )}
    </button>
  );
}
