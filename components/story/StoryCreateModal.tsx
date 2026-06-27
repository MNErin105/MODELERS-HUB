"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { prepareFile, StoredFile } from "@/lib/imageUtils";
import { createStory } from "@/lib/supabase/storiesQueries";
import { useAuth } from "@/lib/context/AuthContext";
import { Story } from "@/lib/types";

type Props = {
  onClose: () => void;
  onCreated: (story: Story) => void;
};

export default function StoryCreateModal({ onClose, onCreated }: Props) {
  const t = useTranslations("story");
  const { user } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredFile | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await prepareFile(file);
      setPreviewUrl(result.previewUrl);
      setStored(result.stored);
      setError(null);
    } catch {
      setError("画像の読み込みに失敗しました。");
    } finally {
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    if (!stored) { setError(t("noImage")); return; }
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const story = await createStory(user.id, stored, caption.trim() || null);
      onCreated(story);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました。");
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("addStory")}
          </span>
          <button type="button" onClick={onClose} aria-label={t("close")}>
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* 9:16 preview frame — black background mirrors actual viewer appearance.
            Fixed at 225×400 (= 9:16) and centered so the modal stays compact. */}
        <div className="flex justify-center py-3" style={{ background: "#000" }}>
          <div
            className="relative overflow-hidden cursor-pointer"
            style={{ width: 225, height: 400, flexShrink: 0 }}
            onClick={() => !previewUrl && inputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                {/* object-contain shows full image with black bars — matches viewer */}
                <Image src={previewUrl} alt="Story preview" fill className="object-contain" unoptimized />
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setStored(null); }}
                >
                  <X size={14} color="white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <ImagePlus size={32} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {t("tapToSelect")}
                </span>
              </div>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Caption + actions */}
        <div className="flex flex-col gap-3 p-4">
          {previewUrl && (
            <div className="flex flex-col gap-1">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                placeholder={t("captionPlaceholder")}
                rows={2}
                className="w-full bg-transparent text-sm outline-none resize-none rounded-lg p-2"
                style={{
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  lineHeight: 1.6,
                }}
              />
              <span className="text-xs text-right" style={{ color: "var(--text-muted)" }}>
                {caption.length}/100
              </span>
            </div>
          )}

          {!previewUrl && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ border: "1px dashed var(--border-subtle)", color: "var(--accent-primary)" }}
            >
              {t("tapToSelect")}
            </button>
          )}

          {error && (
            <p className="text-xs" style={{ color: "var(--error, #ef4444)" }}>{error}</p>
          )}

          {previewUrl && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              {uploading ? (
                <><Loader2 size={15} className="animate-spin" /> {t("uploading")}</>
              ) : t("post")}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-center transition-opacity hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
