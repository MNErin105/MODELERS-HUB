"use client";

import { useLocale } from "@/lib/context/LocaleContext";

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex items-center gap-1 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
      <button
        onClick={() => setLocale("en")}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === "en" ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: locale === "en" ? 600 : 400 }}
        aria-label="Switch to English"
      >EN</button>
      <span style={{ color: "var(--border-muted)" }}>|</span>
      <button
        onClick={() => setLocale("ja")}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === "ja" ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: locale === "ja" ? 600 : 400 }}
        aria-label="Switch to Japanese"
      >JP</button>
    </div>
  );
}
