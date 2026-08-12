"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, Loader2, Pencil, Check } from "lucide-react";
import { ColorRecipeTag } from "@/lib/types";
import {
  getColorRecipeTags,
  createColorRecipeTag,
  updateColorRecipeTag,
  deleteColorRecipeTag,
} from "@/lib/supabase/colorRecipeQueries";
import ColorRecipeStage, { StageTagChanges } from "./ColorRecipeStage";

type Props = {
  postImageId: string;
  imageUrl: string;
  isOwner: boolean;
  onClose: () => void;
};

const DEFAULT_COLOR = "#c8a96e";

/**
 * Color recipe tags for a saved post image. Drawing and pointer handling live
 * in ColorRecipeStage; this component only loads the tags and writes changes
 * back — once per gesture, not per frame.
 */
export default function ColorRecipeViewer({ postImageId, imageUrl, isOwner, onClose }: Props) {
  const t = useTranslations("post.colorRecipe");

  const [tags,    setTags]    = useState<ColorRecipeTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getColorRecipeTags(postImageId).then((fetched) => {
      if (cancelled) return;
      setTags(fetched);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [postImageId]);

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

  function handleTagChange(tagId: string, changes: StageTagChanges, commit: boolean) {
    setTags((prev) => prev.map((tg) => (tg.id === tagId ? { ...tg, ...changes } : tg)));
    if (!commit) return;
    updateColorRecipeTag(tagId, changes)
      .catch((err) => console.error("[ColorRecipeViewer] save failed:", err));
  }

  async function handleAdd(): Promise<string | null> {
    // pin_x/pin_y are NOT NULL, so a new tag starts with its pin under the box
    // (zero-length line); the stage then arms pin placement for it.
    const spot = { x: 0.3, y: 0.3 + (tags.length % 4) * 0.12 };
    try {
      const created = await createColorRecipeTag(postImageId, {
        pin: spot,
        box: spot,
        colorHex: DEFAULT_COLOR,
        content: "",
        sortOrder: tags.length,
      });
      setTags((prev) => [...prev, created]);
      return created.id;
    } catch (err) {
      console.error("[ColorRecipeViewer] create failed:", err);
      return null;
    }
  }

  async function handleDelete(tagId: string) {
    const prev = tags;
    setTags((p) => p.filter((tg) => tg.id !== tagId));
    try {
      await deleteColorRecipeTag(tagId);
    } catch (err) {
      console.error("[ColorRecipeViewer] delete failed:", err);
      setTags(prev);
    }
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

        {isOwner && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {editing ? <Check size={13} /> : <Pencil size={13} />}
            {editing ? t("done") : t("edit")}
          </button>
        )}

        <button
          onClick={onClose}
          aria-label={t("close")}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex">
        <ColorRecipeStage
          imageUrl={imageUrl}
          tags={tags}
          editing={isOwner && editing}
          onTagChange={handleTagChange}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        {!loading && tags.length === 0 && !editing && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <p
              className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(17,17,20,0.9)", color: "var(--text-muted)" }}
            >
              {isOwner ? t("emptyOwner") : t("empty")}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
