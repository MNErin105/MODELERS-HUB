"use client";

import { useState, DragEvent } from "react";
import Image from "next/image";
import { X, GripVertical, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export type UploadedImage = {
  id: string;
  url: string;
  caption: string;
};

type Props = {
  images: UploadedImage[];
  onReorder: (images: UploadedImage[]) => void;
  onDelete: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
};

export default function ImagePreviewGrid({ images, onReorder, onDelete, onCaptionChange }: Props) {
  const t = useTranslations("newPost");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  function onDragStart(e: DragEvent, i: number) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    setOverIdx(i);
  }

  function onDrop(e: DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { reset(); return; }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    reset();
  }

  function reset() { setDragIdx(null); setOverIdx(null); }

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
      {images.map((img, i) => {
        const isDragging = dragIdx === i;
        const isOver     = overIdx === i && dragIdx !== i;
        const isCover    = i === 0;

        return (
          <div
            key={img.id}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={(e)  => onDragOver(e, i)}
            onDrop={(e)      => onDrop(e, i)}
            onDragEnd={reset}
            className="relative rounded-xl overflow-hidden flex flex-col gap-1"
            style={{
              opacity:    isDragging ? 0.4 : 1,
              outline:    isOver ? "2px solid var(--accent-primary)" : "none",
              outlineOffset: "2px",
              transition: "opacity 0.15s, outline 0.1s",
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ aspectRatio: "1/1", background: "var(--bg-tertiary)" }}
            >
              <Image
                src={img.url}
                alt={img.caption || `Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="140px"
                unoptimized
              />

              {/* Cover badge */}
              {isCover && (
                <div
                  className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                >
                  <Star size={9} />
                  {t("image.cover")}
                </div>
              )}

              {/* Index badge */}
              {!isCover && (
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center text-xs font-mono"
                  style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}
                >
                  {i + 1}
                </div>
              )}

              {/* Drag handle */}
              <div
                className="absolute top-1.5 right-8 cursor-grab opacity-60 hover:opacity-100"
                style={{ color: "#fff" }}
              >
                <GripVertical size={14} />
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-70"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                aria-label={t("image.remove")}
              >
                <X size={11} />
              </button>
            </div>

            {/* Caption input */}
            <input
              type="text"
              value={img.caption}
              onChange={(e) => onCaptionChange(img.id, e.target.value)}
              placeholder={t("placeholders.caption")}
              className="w-full text-xs px-1.5 py-1 rounded bg-transparent outline-none"
              style={{
                color:  "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
