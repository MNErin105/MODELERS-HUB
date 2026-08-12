"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { UploadedImage } from "./ImagePreviewGrid";

type Props = {
  images: UploadedImage[];
  /** Tag count per image id, for the badges. */
  tagCounts: Record<string, number>;
  onSelect: (imageId: string) => void;
  onClose: () => void;
};

/** Choose which of the photos being posted to tag. Skipped when there's only one. */
export default function ColorRecipePhotoPicker({ images, tagCounts, onSelect, onClose }: Props) {
  const t = useTranslations("newPost.colorRecipe");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,11,0.9)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {t("pickPhoto")}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cancel")}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => {
            const count = tagCounts[img.id] ?? 0;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(img.id)}
                className="relative aspect-square rounded-lg overflow-hidden transition-all hover:opacity-85"
                style={{
                  border: `2px solid ${count > 0 ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  background: "var(--bg-overlay)",
                }}
              >
                <Image src={img.url} alt="" fill sizes="160px" unoptimized className="object-cover" />
                {count > 0 && (
                  <span
                    className="absolute bottom-1 right-1 min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
