"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Post, Author } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import WorkGrid from "@/components/ui/WorkGrid";
import FollowButton from "@/components/ui/FollowButton";
import { ChevronLeft, Layers, BookMarked, Heart, Wrench, LogOut } from "lucide-react";

type Tab = "works" | "wip" | "liked" | "bookmarks";

type Props = {
  author: Author;
  authorPosts: Post[];
  totalLikes: number;
  totalSaves: number;
  isOwnProfile?: boolean;
  username?: string;
  allPosts?: Post[];
  onSignOut?: () => void;
};

export default function ProfilePageClient({
  author, authorPosts, totalLikes, totalSaves, isOwnProfile = false, username, allPosts = [], onSignOut,
}: Props) {
  const t = useTranslations("profile");
  const { likedIds, savedIds } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("works");

  const wipPosts      = authorPosts.filter((p) => p.buildSteps && p.buildSteps.length > 0);
  const likedPosts    = isOwnProfile ? allPosts.filter((p) => likedIds.has(p.id))    : [];
  const bookmarkPosts = isOwnProfile ? allPosts.filter((p) => savedIds.has(p.id))    : [];

  const tabPosts: Record<Tab, Post[]> = {
    works:     authorPosts,
    wip:       wipPosts,
    liked:     likedPosts,
    bookmarks: bookmarkPosts,
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "works",     label: t("tabs.works"),     icon: <Layers size={14} />,     count: authorPosts.length },
    { key: "wip",       label: t("tabs.wip"),        icon: <Wrench size={14} />,     count: wipPosts.length },
    ...(isOwnProfile ? [
      { key: "liked" as Tab,     label: t("tabs.liked"),     icon: <Heart size={14} />,     count: likedPosts.length },
      { key: "bookmarks" as Tab, label: t("tabs.bookmarks"), icon: <BookMarked size={14} />, count: bookmarkPosts.length },
    ] : []),
  ];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={16} /> {t("backToArchive")}
        </Link>

        {/* Profile header card */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0"
            style={{ border: "3px solid var(--accent-muted)" }}
          >
            <Image
              src={author.avatarUrl || `https://picsum.photos/seed/${author.id}/96/96`}
              alt={author.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={author.avatarUrl.startsWith("https://picsum.photos")}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {author.name}
              </h1>
              {username && (
                <span className="text-sm" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
                  @{username}
                </span>
              )}
              <span
                className="text-sm px-2 py-0.5 rounded"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {author.country}
              </span>
              {isOwnProfile && (
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
                >
                  YOU
                </span>
              )}
            </div>
            {author.bio && (
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                {author.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-5 mb-4">
              <Stat label={t("posts")}      value={authorPosts.length} />
              <Stat label={t("totalLikes")} value={totalLikes}         color="var(--color-like)" />
              <Stat label={t("totalSaves")} value={totalSaves}         color="var(--color-save)" />
              <Stat label={t("followers")}  value={author.followersCount} color="var(--accent-primary)" />
              <Stat label={t("following")}  value={author.followingCount} />
            </div>

            {!isOwnProfile && <FollowButton authorId={author.id} followersCount={author.followersCount} />}
            {isOwnProfile && onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                <LogOut size={14} /> Sign out
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-xl w-fit"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "var(--accent-primary)" : "transparent",
                  color:      active ? "var(--bg-primary)"     : "var(--text-muted)",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? "rgba(0,0,0,0.2)" : "var(--bg-tertiary)",
                    color:      active ? "var(--bg-primary)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <WorkGrid posts={tabPosts[activeTab]} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-lg font-bold" style={{ color: color ?? "var(--text-primary)" }}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
    </div>
  );
}
