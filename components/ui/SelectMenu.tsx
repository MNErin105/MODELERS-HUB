"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  align?: "left" | "right";
  className?: string;
};

// Dropdown select following the same open/close pattern as the Header menus
// (outside mousedown closes, absolutely-positioned z-[100] panel), plus
// Escape-to-close. Absolute rather than fixed: nothing on the profile page
// creates a stacking context around it, so no portal is needed.
export default function SelectMenu<T extends string>({
  value, options, onChange, align = "left", className = "",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
        style={{
          background: "var(--bg-secondary)",
          color:      "var(--text-secondary)",
          border:     "1px solid var(--border-subtle)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.label}
        <ChevronDown
          size={14}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 min-w-[10rem] max-h-72 overflow-y-auto rounded-xl shadow-2xl z-[100]`}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left whitespace-nowrap transition-opacity hover:opacity-80"
                style={{ color: selected ? "var(--accent-primary)" : "var(--text-secondary)" }}
              >
                <span className="w-3.5 shrink-0">{selected && <Check size={14} />}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
