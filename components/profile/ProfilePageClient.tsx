"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Post, Author, PostLog } from "@/lib/types";

import WorkGrid from "@/components/ui/WorkGrid";
import UserAvatar from "@/components/ui/UserAvatar";
import FollowButton from "@/components/ui/FollowButton";
import ProfileEditModal from "./ProfileEditModal";
import AvatarCropModal from "./AvatarCropModal";
import PostLogCard from "@/components/post-logs/PostLogCard";
import BuildLogNoteView from "./BuildLogNoteView";
import { Camera, ChevronLeft, Layers, Bookmark, Heart, LogOut, Loader2, Pencil, PlusSquare, Rss } from "lucide-react";

type Tab = "works" | "logs" | "liked" | "saved";
type LogViewMode = "list" | "note";

type Props = {
  author: Author;
  authorPosts: Post[];
  totalLikes: number;
  totalSaves: number;
  isOwnProfile?: boolean;
  username?: string;
  postLogs?: PostLog[];
  likedPosts?: Post[];
  savedPosts?: Post[];
  featuredThumbnailUrl?: string;
  featuredPostId?: string;
  featuredImageUrl?: string;
  onFeaturedChange?: (postId: string | null) => void;
  onFeaturedImageChange?: (url: string | null) => void;
  onSignOut?: () => void;
  onUpdateAvatar?: (file: File) => Promise<void>;
  pinnedPostIds?: string[];
  onTogglePin?: (postId: string) => void;
  pinError?: string | null;
};

export default function ProfilePageClient({
  author, authorPosts, totalLikes, totalSaves,
  isOwnProfile = false, username,
  postLogs = [],
  likedPosts = [], savedPosts = [],
  featuredThumbnailUrl, featuredPostId, featuredImageUrl,
  onFeaturedChange, onFeaturedImageChange,
  onSignOut, onUpdateAvatar,
  pinnedPostIds = [], onTogglePin, pinError,
}: Props) {
  const t    = useTranslations("profile");
  const tNav = useTranslations("nav");
  const tLog = useTranslations("profile.logView");
  const [activeTab, setActiveTab] = useState<Tab>("works");
  const [logViewMode, setLogViewMode] = useState<LogViewMode>("list");
  const [uploading, setUploading]   = useState(false);
  const [editOpen,  setEditOpen]    = useState(false);
  const [cropSrc,   setCropSrc]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mirrors the postLogs prop into local state so edit/delete on a
  // PostLogCard can update this tab's list/count immediately. Synced via
  // effect because DynamicProfilePage (mypage) fetches postLogs
  // asynchronously and updates the prop after this component has mounted.
  const [postLogsState, setPostLogsState] = useState(postLogs);
  useEffect(() => { setPostLogsState(postLogs); }, [postLogs]);

  function handleLogDeleted(logId: string) {
    setPostLogsState((prev) => prev.filter((l) => l.id !== logId));
  }

  function handleLogUpdated(updated: PostLog) {
    setPostLogsState((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const pinnedSet = new Set(pinnedPostIds);
  const pinnedPosts   = authorPosts.filter((p) => pinnedSet.has(p.id));
  const unpinnedPosts = authorPosts.filter((p) => !pinnedSet.has(p.id));

  const tabPosts: Record<Exclude<Tab, "logs">, Post[]> = {
    works: authorPosts,
    liked: likedPosts,
    saved: savedPosts,
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "works", label: t("tabs.works"), icon: <Layers size={14} />, count: authorPosts.length },
    { key: "logs",  label: t("tabs.buildLogs"), icon: <Rss size={14} />, count: postLogsState.length },
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
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={16} /> {t("backToArchive")}
          </Link>
          {isOwnProfile && (
            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              <PlusSquare size={15} /><span>{tNav("newPost")}</span>
            </Link>
          )}
        </div>

        {/* Profile header card */}
        <div
          className="rounded-2xl mb-8 overflow-hidden relative min-h-[200px]"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {featuredThumbnailUrl && (
            <>
              {/* Desktop: right-side image — mask fades left edge so it blends with the overlay */}
              <div
                className="hidden md:block absolute inset-y-0 right-0 z-0"
                style={{
                  width: "65%",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
                  maskImage:       "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredThumbnailUrl}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              {/* Desktop: gradient overlay — never fully transparent so bright images don't bleed */}
              <div
                className="hidden md:block absolute inset-0 z-[1]"
                style={{ background: "linear-gradient(to right, var(--bg-secondary) 0%, var(--bg-secondary) 15%, rgba(17,17,20,0.7) 35%, rgba(17,17,20,0.3) 55%, rgba(17,17,20,0.08) 75%, transparent 95%)" }}
              />
              {/* Mobile: full-width background */}
              <div className="absolute inset-0 md:hidden z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredThumbnailUrl}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
                />
              </div>
              <div
                className="absolute inset-0 md:hidden z-0"
                style={{ background: "linear-gradient(to bottom right, rgba(10,10,11,0.75) 0%, rgba(10,10,11,0.4) 100%)" }}
              />
            </>
          )}
          {/* Profile content */}
          <div className="relative z-[2] p-6 sm:p-8 md:py-7 md:px-8 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-start gap-6 md:gap-4">
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

          <div className="flex-1 md:flex-none min-w-0">
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
        ) : activeTab === "logs" ? (
          <>
            <div className="flex gap-2 mb-6">
              {(["list", "note"] as LogViewMode[]).map((mode) => {
                const active = logViewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setLogViewMode(mode)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: active ? "var(--accent-primary)" : "var(--bg-secondary)",
                      color:      active ? "var(--bg-primary)"     : "var(--text-secondary)",
                      border:     `1px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {mode === "list" ? tLog("list") : tLog("note")}
                  </button>
                );
              })}
            </div>

            {logViewMode === "note" ? (
              <BuildLogNoteView
                postLogs={postLogsState}
                onDeleted={handleLogDeleted}
                onUpdated={handleLogUpdated}
              />
            ) : postLogsState.length === 0 ? (
              <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                No build logs yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {postLogsState.map((log) => (
                  <PostLogCard
                    key={log.id}
                    log={log}
                    onDeleted={() => handleLogDeleted(log.id)}
                    onUpdated={handleLogUpdated}
                  />
                ))}
              </div>
            )}
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
          authorPosts={authorPosts}
          featuredPostId={featuredPostId}
          featuredImageUrl={featuredImageUrl}
          onFeaturedChange={onFeaturedChange}
          onFeaturedImageChange={onFeaturedImageChange}
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
