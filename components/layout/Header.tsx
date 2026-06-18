"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Bookmark } from "lucide-react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/ui/SearchBar";
import { useApp } from "@/lib/context/AppContext";
import { useLocale } from "@/lib/context/LocaleContext";

function SavedBadge() {
  const { savedIds } = useApp();
  const t = useTranslations("nav");
  return (
    <Link
      href="/saved"
      aria-label={t("savedWorks")}
      className="relative flex items-center gap-1.5 text-sm px-2 py-1 rounded transition-colors hover:opacity-80"
      style={{ color: "var(--text-secondary)" }}
    >
      <Bookmark size={18} />
      {savedIds.size > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
          style={{ background: "var(--color-save)", color: "#fff", fontSize: "10px" }}
        >
          {savedIds.size}
        </span>
      )}
    </Link>
  );
}

function HeaderInner() {
  const { locale, setLocale } = useLocale();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "rgba(10,10,11,0.85)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 h-[100px] flex items-center gap-4">

        {/* Brand logo — left */}
        <Link href="/" className="shrink-0" aria-label="Modelers Hub home">
          <Image
            src="/images/logo.jpeg"
            alt="Modelers Hub"
            width={110}
            height={91}
            className="w-[110px] h-auto object-contain transition-all duration-200 hover:opacity-90 hover:scale-[1.02] cursor-pointer select-none"
          />
        </Link>

        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <SavedBadge />

          <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <button
              onClick={() => setLocale("en")}
              className="px-2 py-1 rounded transition-colors"
              style={{
                color:      locale === "en" ? "var(--accent-primary)" : "var(--text-secondary)",
                fontWeight: locale === "en" ? 600 : 400,
              }}
              aria-label="Switch to English"
            >
              EN
            </button>
            <span style={{ color: "var(--border-muted)" }}>|</span>
            <button
              onClick={() => setLocale("ja")}
              className="px-2 py-1 rounded transition-colors"
              style={{
                color:      locale === "ja" ? "var(--accent-primary)" : "var(--text-secondary)",
                fontWeight: locale === "ja" ? 600 : 400,
              }}
              aria-label="Switch to Japanese"
            >
              JP
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense>
      <HeaderInner />
    </Suspense>
  );
}
