"use client";

import { useMemo, useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export type TagSuggestion = { value: string; label: string };

type Props = {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: TagSuggestion[];
  max?: number;
};

export default function TagInput({ label, value, onChange, placeholder, suggestions = [], max = 20 }: Props) {
  const t = useTranslations("newPost");
  const [input, setInput]     = useState("");
  const [showSug, setShowSug] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = t("placeholders.addTag");
  const ph = placeholder ?? defaultPlaceholder;

  // Map stored values → display labels for chips
  const labelMap = useMemo(
    () => Object.fromEntries(suggestions.map((s) => [s.value, s.label])),
    [suggestions],
  );

  const filtered = suggestions.filter(
    (s) => s.label.toLowerCase().includes(input.toLowerCase()) && !value.includes(s.value),
  );

  function add(val: string) {
    const cleaned = val.trim().replace(/^#+/, "");
    if (!cleaned || value.includes(cleaned) || value.length >= max) return;
    onChange([...value, cleaned]);
    setInput("");
    setShowSug(false);
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

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </label>

      {/* Chip container */}
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
            {labelMap[tag] ?? tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSug(true); }}
            onKeyDown={onKey}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            placeholder={value.length === 0 ? ph : ""}
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            disabled={value.length >= max}
          />

          {/* Suggestions dropdown */}
          {showSug && filtered.length > 0 && (
            <div
              className="absolute top-full left-0 mt-1 z-20 rounded-lg overflow-hidden w-48"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {filtered.slice(0, 8).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onMouseDown={() => add(s.value)}
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {t("tagHint")}
        {value.length >= max && <> {t("tagHintMax", { max })}</>}
      </p>
    </div>
  );
}
