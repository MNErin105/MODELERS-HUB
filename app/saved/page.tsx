"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/context/AppContext";
import { getPostsByIds } from "@/lib/supabase/queries";
import WorkGrid from "@/components/ui/WorkGrid";
import { ChevronLeft, Bookmark, Loader2 } from "lucide-react";
import type { Post } from "@/lib/types";

export default function SavedPage() {
  const t  = useTranslations("saved");
  const tn = useTranslations("category");
  const { savedIds } = useApp();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = [...savedIds];
    if (ids.length === 0) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }
    getPostsByIds(ids).then((posts) => {
      setSavedPosts(posts);
      setLoading(false);
    });
  }, [savedIds]);

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={16} /> {tn("backToArchive")}
        </Link>

        <div className="flex items-baseline gap-3 mb-8">
          <h1
            className="text-4xl font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("title")}
          </h1>
          {!loading && (
            <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {t("count", { count: savedPosts.length })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Bookmark size={48} style={{ color: "var(--text-muted)" }} />
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>{t("emptyTitle")}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("emptySubtitle")}</p>
            <Link
              href="/"
              className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
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
