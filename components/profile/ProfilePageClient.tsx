"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Post, Author } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";
import FollowButton from "@/components/ui/FollowButton";
import { ChevronLeft } from "lucide-react";

type Props = {
  author: Author;
  authorPosts: Post[];
  totalLikes: number;
  totalSaves: number;
};

export default function ProfilePageClient({ author, authorPosts, totalLikes, totalSaves }: Props) {
  const t = useTranslations("profile");

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

        {/* Profile header */}
        <div
          className="rounded-2xl p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {/* Avatar */}
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden shrink-0"
            style={{ border: "3px solid var(--accent-muted)" }}
          >
            <Image src={author.avatarUrl} alt={author.name} fill className="object-cover" sizes="96px" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {author.name}
              </h1>
              <span
                className="text-sm px-2 py-0.5 rounded font-mono"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
              >
                {author.country}
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {author.bio}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-4">
              <Stat label={t("posts")}       value={authorPosts.length} />
              <Stat label={t("totalLikes")}  value={totalLikes}         color="var(--color-like)" />
              <Stat label={t("totalSaves")}  value={totalSaves}         color="var(--color-save)" />
              <Stat label={t("followers")}   value={author.followersCount} color="var(--accent-primary)" />
              <Stat label={t("following")}   value={author.followingCount} />
            </div>

            <FollowButton authorId={author.id} followersCount={author.followersCount} />
          </div>
        </div>

        {/* Works grid */}
        <div className="mb-6 flex items-baseline gap-3">
          <h2
            className="text-xl font-bold tracking-wider"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("worksTitle")}
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {t("postsCount", { count: authorPosts.length })}
          </span>
        </div>
        <WorkGrid posts={authorPosts} />
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
