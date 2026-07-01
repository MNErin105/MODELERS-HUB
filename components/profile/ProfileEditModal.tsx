"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { X, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { setFeaturedPost, clearFeaturedPost, uploadFeaturedImage, clearFeaturedImageUrl } from "@/lib/featured";
import { prepareFile } from "@/lib/imageUtils";
import type { StoredFile } from "@/lib/imageUtils";
import type { Post } from "@/lib/types";
import FeaturedImageCropModal from "./FeaturedImageCropModal";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function validateUsername(val: string): string | null {
  if (!val)            return "Username is required.";
  if (val.length < 3)  return "At least 3 characters required.";
  if (val.length > 20) return "20 characters maximum.";
  if (!USERNAME_RE.test(val)) return "Lowercase letters, numbers, and _ only.";
  return null;
}

type Props = {
  initialName:            string;
  initialBio:             string;
  initialUsername:        string;
  authorPosts:            Post[];
  featuredPostId?:        string;
  featuredImageUrl?:      string;
  onFeaturedChange?:      (postId: string | null) => void;
  onFeaturedImageChange?: (url: string | null) => void;
  onClose:                () => void;
};

type BgMode = "post" | "image" | "none";

export default function ProfileEditModal({
  initialName, initialBio, initialUsername,
  authorPosts, featuredPostId, featuredImageUrl,
  onFeaturedChange, onFeaturedImageChange,
  onClose,
}: Props) {
  const { updateProfile, user } = useAuth();

  const [name,          setName]          = useState(initialName);
  const [bio,           setBio]           = useState(initialBio);
  const [username,      setUsername]      = useState(initialUsername);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const [bgMode, setBgMode] = useState<BgMode>(
    featuredImageUrl ? "image" : (featuredPostId ? "post" : "none")
  );
  const [selectedFeaturedId,  setSelectedFeaturedId]  = useState<string | null>(
    !featuredImageUrl ? (featuredPostId ?? null) : null
  );
  const [pendingStoredFile,   setPendingStoredFile]   = useState<StoredFile | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [cropSrc,             setCropSrc]             = useState<string | null>(null);

  const imageInputRef  = useRef<HTMLInputElement>(null);
  const pendingUrlRef  = useRef<string | null>(null);
  const cropSrcRef     = useRef<string | null>(null);

  useEffect(() => {
    pendingUrlRef.current = pendingImagePreview;
  }, [pendingImagePreview]);

  useEffect(() => {
    cropSrcRef.current = cropSrc;
  }, [cropSrc]);

  useEffect(() => {
    return () => {
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
      if (cropSrcRef.current) URL.revokeObjectURL(cropSrcRef.current);
    };
  }, []);

  const activeImageUrl: string | null =
    pendingImagePreview ??
    (bgMode === "image" ? (featuredImageUrl ?? null) : null);

  function handleUsernameChange(raw: string) {
    const normalized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalized);
    setUsernameError(validateUsername(normalized));
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const { previewUrl } = await prepareFile(file);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(previewUrl);
  }

  async function handleCropApply(croppedFile: File) {
    const { previewUrl, stored } = await prepareFile(croppedFile);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingStoredFile(stored);
    setPendingImagePreview(previewUrl);
    setBgMode("image");
    setSelectedFeaturedId(null);
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handlePostSelect(postId: string) {
    const isSelected = bgMode === "post" && selectedFeaturedId === postId;
    if (isSelected) {
      setSelectedFeaturedId(null);
      setBgMode("none");
    } else {
      setSelectedFeaturedId(postId);
      setBgMode("post");
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
      setPendingStoredFile(null);
      setPendingImagePreview(null);
    }
  }

  function handleImageRemove() {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingStoredFile(null);
    setPendingImagePreview(null);
    setBgMode("none");
  }

  function handleClearAll() {
    setSelectedFeaturedId(null);
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingStoredFile(null);
    setPendingImagePreview(null);
    setBgMode("none");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uErr = validateUsername(username);
    if (uErr) { setUsernameError(uErr); return; }
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim(), username });

      if (user) {
        if (bgMode === "image") {
          if (pendingStoredFile) {
            const url = await uploadFeaturedImage(
              user.id, pendingStoredFile.buffer, pendingStoredFile.contentType, pendingStoredFile.ext
            );
            onFeaturedImageChange?.(url);
            if (featuredPostId) onFeaturedChange?.(null);
          }
          // else: existing image unchanged — no DB action needed
        } else if (bgMode === "post" && selectedFeaturedId) {
          const postChanged = selectedFeaturedId !== (featuredPostId ?? null);
          const imageExists = !!featuredImageUrl;
          if (postChanged || imageExists) {
            await setFeaturedPost(user.id, selectedFeaturedId);
            if (imageExists) {
              await clearFeaturedImageUrl(user.id);
              onFeaturedImageChange?.(null);
            }
            if (postChanged) onFeaturedChange?.(selectedFeaturedId);
          }
        } else {
          // bgMode === "none"
          if (featuredPostId) {
            await clearFeaturedPost(user.id);
            onFeaturedChange?.(null);
          }
          if (featuredImageUrl) {
            await clearFeaturedImageUrl(user.id);
            onFeaturedImageChange?.(null);
          }
        }
      }
      onClose();
    } catch (err) {
      console.error("[ProfileEditModal] save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!name.trim() && !validateUsername(username);

  return (
    <>
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          aria-label="Close"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Display Name ─────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Display Name <span style={{ color: "var(--accent-primary)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              disabled={saving}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-primary)",
                border:     "1px solid var(--border-subtle)",
                color:      "var(--text-primary)",
              }}
            />
          </div>

          {/* ── Username ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Username <span style={{ color: "var(--accent-primary)" }}>*</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                required
                disabled={saving}
                placeholder="your_handle"
                className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-primary)",
                  border:     `1px solid ${usernameError ? "#f87171" : "var(--border-subtle)"}`,
                  color:      "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
            {usernameError ? (
              <p className="text-xs" style={{ color: "#f87171", fontFamily: "var(--font-mono)" }}>
                {usernameError}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                3–20 chars · a–z · 0–9 · _
              </p>
            )}
          </div>

          {/* ── Bio ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
              disabled={saving}
              placeholder="Tell the community about your builds…"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{
                background: "var(--bg-primary)",
                border:     "1px solid var(--border-subtle)",
                color:      "var(--text-primary)",
                lineHeight: 1.6,
              }}
            />
            <p className="text-right text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {bio.length} / 200
            </p>
          </div>

          {/* ── 看板作品 ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                看板作品
              </label>
              {bgMode !== "none" && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={saving}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                >
                  選択解除
                </button>
              )}
            </div>

            {/* Image upload row */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                style={{
                  background: bgMode === "image" ? "var(--accent-muted)" : "var(--bg-tertiary)",
                  color:      bgMode === "image" ? "var(--accent-primary)" : "var(--text-secondary)",
                  border:     "1px solid var(--border-subtle)",
                }}
              >
                <Upload size={12} />
                {activeImageUrl ? "変更" : "画像をアップロード"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageFileChange}
              />
              {activeImageUrl && (
                <>
                  <div
                    className="relative shrink-0 rounded-lg overflow-hidden"
                    style={{ width: 48, height: 48, border: "2px solid var(--accent-primary)" }}
                  >
                    <Image
                      src={activeImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized={activeImageUrl.startsWith("blob:")}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleImageRemove}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                  >
                    削除
                  </button>
                </>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "2px 0" }} />

            {/* Post thumbnails */}
            {authorPosts.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                まだ投稿がありません / No posts yet
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                {authorPosts.map((post) => {
                  const isSelected = bgMode === "post" && selectedFeaturedId === post.id;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      disabled={saving}
                      onClick={() => handlePostSelect(post.id)}
                      className="relative shrink-0 rounded-lg overflow-hidden transition-all hover:opacity-90 disabled:cursor-not-allowed"
                      style={{
                        width:      64,
                        height:     64,
                        border:     `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                        outline:    "none",
                        transition: "border-color 0.15s ease",
                      }}
                      title={post.title}
                    >
                      <Image src={post.thumbnailUrl} alt={post.title} fill className="object-cover" sizes="64px" />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <span style={{ color: "var(--accent-primary)", fontSize: 18, lineHeight: 1 }}>★</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {bgMode === "post" && selectedFeaturedId
                ? authorPosts.find((p) => p.id === selectedFeaturedId)?.title ?? ""
                : bgMode === "none" && authorPosts.length > 0
                  ? "投稿を選んでプロフィール背景に設定"
                  : ""}
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                background: "var(--bg-tertiary)",
                color:      "var(--text-secondary)",
                border:     "1px solid var(--border-subtle)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
    {cropSrc && (
      <FeaturedImageCropModal
        imageSrc={cropSrc}
        onApply={handleCropApply}
        onCancel={handleCropCancel}
      />
    )}
    </>
  );
}
