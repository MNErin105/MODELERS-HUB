"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  onFilesAdded: (files: File[]) => void;
  currentCount: number;
  max?: number;
};

export default function ImageUploadZone({ onFilesAdded, currentCount, max = 20 }: Props) {
  const t = useTranslations("newPost");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = max - currentCount;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (valid.length > 0) onFilesAdded(valid);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  if (remaining <= 0) return null;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className="relative flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all select-none"
      style={{
        minHeight: currentCount === 0 ? 200 : 100,
        border: `2px dashed ${dragging ? "var(--accent-primary)" : "var(--border-muted)"}`,
        background: dragging ? "var(--accent-muted)" : "var(--bg-secondary)",
        color: dragging ? "var(--accent-primary)" : "var(--text-muted)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={onChange}
      />

      {currentCount === 0 ? (
        <>
          <Upload size={36} style={{ opacity: 0.6 }} />
          <div className="text-center px-6">
            <p className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("upload.dropHint")}
            </p>
            <p className="text-xs mt-1" style={{ fontFamily: "var(--font-mono)" }}>
              {t("upload.formats", { max })}
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 py-3">
          <ImagePlus size={18} />
          <span className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
            {t("upload.addMore", { remaining })}
          </span>
        </div>
      )}
    </div>
  );
}
