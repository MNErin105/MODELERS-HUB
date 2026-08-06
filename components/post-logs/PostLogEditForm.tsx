"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Send, X, ImagePlus, AlertCircle } from "lucide-react";
import { CATEGORIES, Category, PostLog } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { prepareFile, StoredFile } from "@/lib/imageUtils";
import { updatePostLog, PostLogImageInput } from "@/lib/supabase/postLogsQueries";
import CropModal from "@/components/ui/CropModal";

const CONTENT_MAX = 280;
const MAX_IMAGES  = 2;

const inputStyle = {
  background: "var(--bg-secondary)",
  border:     "1px solid var(--border-subtle)",
  color:      "var(--text-primary)",
};

type ImageSlot =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; previewUrl: string; stored: StoredFile };

function previewUrlOf(img: ImageSlot): string {
  return img.kind === "existing" ? img.url : img.previewUrl;
}

type Props = {
  log: PostLog;
  onCancel: () => void;
  onSaved: (updated: PostLog) => void;
};

export default function PostLogEditForm({ log, onCancel, onSaved }: Props) {
  const locale = useLocale();
  const isJa   = locale === "ja";
  const tc     = useTranslations("category");
  const { user } = useAuth();

  const [content, setContent] = useState(log.content);
  const [genre,   setGenre]   = useState<Category>(log.genre);

  const [images,  setImages]  = useState<ImageSlot[]>(() =>
    log.imageUrls.map((url) => ({ id: url, kind: "existing" as const, url })),
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || images.length >= MAX_IMAGES) return;
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropApply(croppedFile: File) {
    const src = cropSrc;
    setCropSrc(null);
    if (src) URL.revokeObjectURL(src);
    const { previewUrl, stored } = await prepareFile(croppedFile);
    setImages((prev) => [...prev, { id: previewUrl, kind: "new" as const, previewUrl, stored }].slice(0, MAX_IMAGES));
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleSave() {
    if (!user || !content.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const imageInputs: PostLogImageInput[] = images.map((img) =>
        img.kind === "existing" ? { kind: "existing", url: img.url } : { kind: "new", stored: img.stored },
      );
      const updated = await updatePostLog(user.id, log.id, content.trim(), genre, imageInputs);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isJa ? "保存に失敗しました" : "Failed to save."));
      setSaving(false);
    }
  }

  const remaining = CONTENT_MAX - content.length;

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-primary)" }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors resize-vertical"
        style={{ ...inputStyle, lineHeight: 1.7 }}
      />
      <div className="flex justify-end -mt-1">
        <span
          className="text-xs"
          style={{ color: remaining <= 20 ? "#f87171" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {isJa ? `残り${remaining}文字` : `${remaining} left`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const selected = genre === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setGenre(cat)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: selected ? "var(--accent-primary)" : "var(--bg-tertiary)",
                color:      selected ? "var(--bg-primary)"     : "var(--text-secondary)",
                border:     `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              }}
            >
              {tc(`names.${cat.replace(/\s+/g, "_")}`)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative w-24 rounded-lg overflow-hidden" style={{ aspectRatio: "1/1" }}>
            <Image src={previewUrlOf(img)} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
              aria-label={isJa ? "画像を削除" : "Remove image"}
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label
            className="flex items-center gap-1.5 w-fit px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 self-start"
            style={{ background: "var(--bg-tertiary)", border: "1px dashed var(--border-muted)", color: "var(--text-muted)" }}
          >
            <ImagePlus size={14} />
            {isJa ? "画像を追加" : "Add a photo"}
            <input type="file" accept="image/*,image/heic,image/heif" className="sr-only" onChange={handleFileSelect} />
          </label>
        )}
      </div>

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          aspect={1}
          cropShape="rect"
          outputWidth={800}
          outputHeight={800}
          filename="buildlog.jpg"
          title={isJa ? "画像を切り抜き" : "Crop Photo"}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      {error && (
        <p className="flex items-center gap-2 text-xs" style={{ color: "#f87171" }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {isJa ? "キャンセル" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          <Send size={13} />
          {saving ? (isJa ? "保存中..." : "Saving...") : (isJa ? "保存" : "Save")}
        </button>
      </div>
    </div>
  );
}
