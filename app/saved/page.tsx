"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { posts } from "@/lib/dummy-data";
import { useApp } from "@/lib/context/AppContext";
import WorkGrid from "@/components/ui/WorkGrid";
import { ChevronLeft, Bookmark } from "lucide-react";

export default function SavedPage() {
  const { savedIds } = useApp();
  const savedPosts = posts.filter((p) => savedIds.has(p.id));
  const t  = useTranslations("saved");
  const tn = useTranslations("category");

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}>
          <ChevronLeft size={16} /> {tn("backToArchive")}
        </Link>

        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="text-4xl font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {t("title")}
          </h1>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("count", { count: savedPosts.length })}
          </span>
        </div>

        {savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Bookmark size={48} style={{ color: "var(--text-muted)" }} />
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>{t("emptyTitle")}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("emptySubtitle")}</p>
            <Link href="/" className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}>
              {t("browseButton")}
            </Link>
          </div>
        ) : (
          <WorkGrid posts={savedPosts} />
        )}
      </div>
    </div>
  );
}
