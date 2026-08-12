"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { DraftColorRecipeTag } from "@/lib/types";
import ColorRecipeStage, { StageTagChanges } from "./ColorRecipeStage";

type Props = {
  /** Object URL of the not-yet-uploaded photo. */
  imageUrl: string;
  tags: DraftColorRecipeTag[];
  onChange: (tags: DraftColorRecipeTag[]) => void;
  onClose: () => void;
};

const DEFAULT_COLOR = "#c8a96e";

/**
 * The same tagging surface as ColorRecipeViewer, but for a post that hasn't
 * been submitted yet: tags live in the form's state and are written to the DB
 * in one batch once the images have been uploaded.
 */
export default function ColorRecipeDraftEditor({ imageUrl, tags, onChange, onClose }: Props) {
  const t = useTranslations("post.colorRecipe");

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

  // Nothing is persisted here, so the stage's commit flag is irrelevant.
  function handleTagChange(tagId: string, changes: StageTagChanges) {
    onChange(tags.map((tg) => (tg.id === tagId ? { ...tg, ...changes } : tg)));
  }

  async function handleAdd(): Promise<string> {
    const spot = { x: 0.3, y: 0.3 + (tags.length % 4) * 0.12 };
    const created: DraftColorRecipeTag = {
      id: crypto.randomUUID(),
      pin: spot,
      box: spot,
      colorHex: DEFAULT_COLOR,
      content: "",
    };
    onChange([...tags, created]);
    return created.id;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(10,10,11,0.94)" }}>
      <div
        className="flex items-center gap-3 px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {t("title")}
        </span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          <Check size={13} /> {t("done")}
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex">
        <ColorRecipeStage
          imageUrl={imageUrl}
          tags={tags}
          editing
          unoptimized
          onTagChange={handleTagChange}
          onAdd={handleAdd}
          onDelete={(tagId) => onChange(tags.filter((tg) => tg.id !== tagId))}
        />
      </div>
    </div>,
    document.body,
  );
}
