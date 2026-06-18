"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer
      className="w-full mt-auto py-10 px-6"
      style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className="text-xl tracking-widest"
          style={{ fontFamily: "var(--font-display)", color: "var(--accent-primary)" }}
        >
          MODELERS HUB
        </p>
        <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {t("tagline")}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Modelers Hub
        </p>
      </div>
    </footer>
  );
}
