"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Post, Author } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import WorkGrid from "@/components/ui/WorkGrid";
import UserAvatar from "@/components/ui/UserAvatar";
import FollowButton from "@/components/ui/FollowButton";
import ProfileEditModal from "./ProfileEditModal";
import AvatarCropModal from "./AvatarCropModal";
import { Camera, ChevronLeft, Layers, Bookmark, Heart, Wrench, LogOut, Loader2, Pencil } from "lucide-react";

type Tab = "works" | "wip" | "liked" | "saved";

type Props = {
  author: Author;
  authorPosts: Post[];
  totalLikes: number;
  totalSaves: number;
  isOwnProfile?: boolean;
  username?: string;
  allPosts?: Post[];
  onSignOut?: () => void;
  onUpdateAvatar?: (file: File) => Promise<void>;
  pinnedPostIds?: string[];
  onTogglePin?: (postId: string) => void;
  pinError?: string | null;
};

export default function ProfilePageClient({
  author, authorPosts, totalLikes, totalSaves,
  isOwnProfile = false, username, allPosts = [],
  onSignOut, onUpdateAvatar,
  pinnedPostIds = [], onTogglePin, pinError,
}: Props) {
  const t = useTranslations("profile");
  const { likedIds, savedIds } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("works");
  const [uploading, setUploading]   = useState(false);
  const [editOpen,  setEditOpen]    = useState(false);
  const [cropSrc,   setCropSrc]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wipPosts      = authorPosts.filter((p) => p.buildSteps && p.buildSteps.length > 0);
  const likedPosts    = isOwnProfile ? allPosts.filter((p) => likedIds.has(p.id))  : [];
  const savedPosts    = isOwnProfile ? allPosts.filter((p) => savedIds.has(p.id)) : [];
  const pinnedSet     = new Set(pinnedPostIds);
  const pinnedPosts   = authorPosts.filter((p) => pinnedSet.has(p.id));
  const unpinnedPosts = authorPosts.filter((p) => !pinnedSet.has(p.id));

  const tabPosts: Record<Tab, Post[]> = {
    works: authorPosts,
    wip:   wipPosts,
    liked: likedPosts,
    saved: savedPosts,
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "works", label: t("tabs.works"), icon: <Layers size={14} />, count: authorPosts.length },
    { key: "wip",   label: t("tabs.wip"),   icon: <Wrench size={14} />, count: wipPosts.length },
    ...(isOwnProfile ? [
      { key: "liked" as Tab, label: t("tabs.liked"), icon: <Heart    size={14} />, count: likedPosts.length },
      { key: "saved" as Tab, label: t("tabs.saved"), icon: <Bookmark size={14} />, count: savedPosts.length },
    ] : []),
  ];

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Open crop modal instead of uploading immediately.
    // Reset the input here so the same file can be re-selected after cancel.
    const objectUrl = URL.createObjectURL(file);
    e.target.value = "";
    setCropSrc(objectUrl);
  }

  async function handleCropApply(croppedFile: File) {
    if (!onUpdateAvatar) return;
    // Capture before clearing state, then revoke
    const src = cropSrc;
    setCropSrc(null);
    if (src) URL.revokeObjectURL(src);
    setUploading(true);
    try {
      await onUpdateAvatar(croppedFile);
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

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
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden"
              style={{ border: "3px solid var(--accent-muted)" }}
            >
              <UserAvatar src={author.avatarUrl} alt={author.name} fill />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "#fff" }} />
                </div>
              )}
              {isOwnProfile && !uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                  aria-label="Change profile photo"
                >
                  <Camera size={20} style={{ color: "#fff" }} />
                </button>
              )}
            </div>
            {isOwnProfile && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            )}
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
              {author.country && (
                <span
                  className="text-sm px-2 py-0.5 rounded"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                >
                  {author.country}
                </span>
              )}
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
            {isOwnProfile && (
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{
                    background: "var(--bg-tertiary)",
                    color:      "var(--text-secondary)",
                    border:     "1px solid var(--border-subtle)",
                  }}
                >
                  <Pencil size={13} /> Edit Profile
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                )}
              </div>
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
        {activeTab === "works" && isOwnProfile ? (
          <>
            {pinError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                {pinError}
              </div>
            )}
            {pinnedPosts.length > 0 && (
              <>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                >
                  📌 ピン留め
                </p>
                <WorkGrid
                  posts={pinnedPosts}
                  pinnedIds={pinnedSet}
                  onTogglePin={onTogglePin}
                />
                {unpinnedPosts.length > 0 && (
                  <div className="mt-6 mb-6" style={{ borderTop: "1px solid var(--border-subtle)" }} />
                )}
              </>
            )}
            <WorkGrid
              posts={unpinnedPosts}
              pinnedIds={pinnedSet}
              onTogglePin={onTogglePin}
            />
          </>
        ) : (
          <WorkGrid posts={tabPosts[activeTab]} />
        )}
      </div>

      {editOpen && (
        <ProfileEditModal
          initialName={author.name}
          initialBio={author.bio}
          initialUsername={username ?? ""}
          onClose={() => setEditOpen(false)}
        />
      )}

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
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
