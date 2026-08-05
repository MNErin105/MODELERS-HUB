"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, Send, AlertCircle, X, ImagePlus } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { prepareFile, StoredFile } from "@/lib/imageUtils";
import { getPostsByUserId } from "@/lib/supabase/queries";
import { createPostLog } from "@/lib/supabase/postLogsQueries";
import { CATEGORIES, Category, Post } from "@/lib/types";

const CONTENT_MAX = 280;

const inputStyle = {
  background: "var(--bg-secondary)",
  border:     "1px solid var(--border-subtle)",
  color:      "var(--text-primary)",
};

export default function PostLogComposer() {
  const router = useRouter();
  const locale = useLocale();
  const isJa   = locale === "ja";
  const tc     = useTranslations("category");
  const { user, openLoginModal } = useAuth();

  const [content, setContent] = useState("");
  const [genre,   setGenre]   = useState<Category | null>(null);

  // Image — single file, same prepareFile flow as NewPostForm
  const [imagePreview, setImagePreview] = useState<{ id: string; url: string } | null>(null);
  const [imageStored,  setImageStored]  = useState<StoredFile | null>(null);

  // Optional link to one of the user's own posts
  const [ownPosts,       setOwnPosts]       = useState<Post[]>([]);
  const [linkedPostId,   setLinkedPostId]   = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getPostsByUserId(user.id).then(setOwnPosts);
  }, [user]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { previewUrl, stored } = await prepareFile(file);
    setImagePreview({ id: previewUrl, url: previewUrl });
    setImageStored(stored);
  }

  function removeImage() {
    setImagePreview(null);
    setImageStored(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim() || !genre || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const log = await createPostLog(
        user.id,
        content.trim(),
        genre,
        linkedPostId,
        imageStored ? { stored: imageStored } : null,
      );
      router.push(`/build-logs#${log.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("post logs per 7-day")) {
        setError(isJa ? "今週の制作ログは上限（3件）に達しています" : "You've reached this week's limit of 3 build logs.");
      } else {
        setError(message || (isJa ? "投稿に失敗しました" : "Failed to post."));
      }
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      >
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          {isJa ? "ログインが必要です" : "Please log in to continue"}
        </p>
        <button
          onClick={openLoginModal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          {isJa ? "ログイン" : "Log in"}
        </button>
      </div>
    );
  }

  const remaining = CONTENT_MAX - content.length;

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href="/build-logs"
            className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={16} /> {isJa ? "戻る" : "Back"}
          </Link>
          <h1
            className="text-3xl font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {isJa ? "制作ログ" : "Build Log"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {isJa ? "気軽な近況・つぶやきを投稿できます（週3回まで）" : "Share a quick update — up to 3 per week."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ── Content ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
              placeholder={isJa ? "いま何してる？" : "What's on your bench?"}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors resize-vertical"
              style={{ ...inputStyle, lineHeight: 1.7 }}
            />
            <div className="flex justify-end">
              <span
                className="text-xs"
                style={{ color: remaining <= 20 ? "#f87171" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {isJa ? `残り${remaining}文字` : `${remaining} left`}
              </span>
            </div>
          </div>

          {/* ── Genre (required) ────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              {isJa ? "ジャンルを選択" : "Select a genre"}
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = genre === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGenre(cat)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                    style={{
                      background: selected ? "var(--accent-primary)" : "var(--bg-secondary)",
                      color:      selected ? "var(--bg-primary)"     : "var(--text-secondary)",
                      border:     `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {tc(`names.${cat.replace(/\s+/g, "_")}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Image ────────────────────────────────────────────────── */}
          {imagePreview ? (
            <div className="relative w-40 rounded-xl overflow-hidden" style={{ aspectRatio: "1/1" }}>
              <Image src={imagePreview.url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                aria-label={isJa ? "画像を削除" : "Remove image"}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <label
              className="flex items-center gap-2 w-fit px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border-muted)", color: "var(--text-muted)" }}
            >
              <ImagePlus size={16} />
              {isJa ? "画像を追加（任意・1枚まで）" : "Add a photo (optional, up to 1)"}
              <input type="file" accept="image/*,image/heic,image/heif" className="sr-only" onChange={handleImageSelect} />
            </label>
          )}

          {/* ── Linked post (optional, understated) ─────────────────── */}
          <div className="flex flex-col gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              {isJa ? "関連する作品を選択（任意）" : "Link a work (optional)"}
            </span>
            {ownPosts.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isJa ? "投稿がまだありません" : "You haven't posted any works yet."}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {ownPosts.map((post) => {
                  const selected = linkedPostId === post.id;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setLinkedPostId(selected ? null : post.id)}
                      className="relative shrink-0 rounded-lg overflow-hidden transition-all hover:opacity-90"
                      style={{ width: 56, height: 56, border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}` }}
                      title={post.title}
                    >
                      <Image src={post.thumbnailUrl} alt={post.title} fill className="object-cover" sizes="56px" />
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <span style={{ color: "var(--accent-primary)", fontSize: 16, lineHeight: 1 }}>★</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {linkedPostId && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {ownPosts.find((p) => p.id === linkedPostId)?.title ?? ""}
              </p>
            )}
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {/* ── Submit ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Link
              href="/build-logs"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              {isJa ? "キャンセル" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={submitting || !content.trim() || !genre}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              <Send size={15} />
              {submitting ? (isJa ? "投稿中..." : "Posting...") : (isJa ? "投稿する" : "Post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
