"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Post, BuildStep } from "@/lib/types";
import { ChevronLeft, Image as ImageIcon, BookOpen, MessageSquare } from "lucide-react";
import WorksTab from "./WorksTab";
import BuildJournalTab from "./BuildJournalTab";
import CommentsTab from "./CommentsTab";

type Tab = "works" | "journal" | "comments";

type Props = {
  post: Post;
  buildSteps: BuildStep[];
};

export default function PostDetailClient({ post, buildSteps }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("post");
  const activeTab = (searchParams.get("tab") as Tab) ?? "works";

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "works",   label: t("tabs.works"),   icon: ImageIcon },
    { id: "journal", label: t("tabs.journal"),  icon: BookOpen,  count: buildSteps.length },
    { id: "comments", label: t("tabs.comments"), icon: MessageSquare },
  ];

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "works") params.delete("tab");
    else params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={16} /> {t("backToArchive")}
        </Link>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div className="w-full" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex gap-0">
            {TABS.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors"
                  style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                  aria-selected={isActive}
                  role="tab"
                >
                  <Icon size={15} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                      style={{
                        background: isActive ? "var(--accent-muted)" : "var(--bg-tertiary)",
                        color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: "var(--accent-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {activeTab === "works"    && <WorksTab post={post} />}
        {activeTab === "journal"  && <BuildJournalTab steps={buildSteps} />}
        {activeTab === "comments" && <CommentsTab postId={post.id} />}
      </div>
    </div>
  );
}
