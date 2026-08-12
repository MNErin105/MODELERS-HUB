"use client";

import { useRef, useState, PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Crosshair, X } from "lucide-react";
import type { StageTag } from "./ColorRecipeStage";

type Props = {
  tag: StageTag;
  /** Position within the stage, in px. */
  x: number;
  y: number;
  editing: boolean;
  /** True while this tag is waiting for a tap on the photo to place its pin. */
  awaitingPin: boolean;
  onBoxPointerDown:    (e: ReactPointerEvent) => void;
  onHandlePointerDown: (e: ReactPointerEvent) => void;
  onColorInput:  (hex: string) => void;
  onColorCommit: (hex: string) => void;
  onContentCommit: (text: string) => void;
  onDelete: () => void;
};

export default function ColorRecipeTagBox({
  tag, x, y, editing, awaitingPin,
  onBoxPointerDown, onHandlePointerDown,
  onColorInput, onColorCommit, onContentCommit, onDelete,
}: Props) {
  const t = useTranslations("post.colorRecipe");
  // Seeded once; the box is keyed by tag id, so a different tag remounts it.
  const [text, setText] = useState(tag.content);
  const colorRef = useRef<HTMLInputElement>(null);

  if (!editing) {
    return (
      <div
        className="absolute flex items-center gap-2 px-2.5 py-1.5 rounded-lg max-w-[240px]"
        style={{
          left: x, top: y,
          transform: "translate(-50%, -50%)",
          background: "rgba(17,17,20,0.92)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="shrink-0 rounded"
          style={{ width: 16, height: 16, background: tag.colorHex, border: "1px solid rgba(255,255,255,0.35)" }}
        />
        <span className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
          {tag.content || tag.colorHex.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      onPointerDown={onBoxPointerDown}
      className="absolute flex flex-col gap-1.5 p-2 rounded-lg"
      style={{
        left: x, top: y,
        transform: "translate(-50%, -50%)",
        width: 210,
        background: "rgba(17,17,20,0.96)",
        border: `1px solid ${awaitingPin ? "var(--accent-primary)" : "var(--border-subtle)"}`,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <div className="flex items-center gap-2">
        {/* Swatch — opens the OS colour picker */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => colorRef.current?.click()}
          aria-label={t("pickColor")}
          className="shrink-0 rounded"
          style={{ width: 22, height: 22, background: tag.colorHex, border: "1px solid rgba(255,255,255,0.4)" }}
        />
        <input
          ref={colorRef}
          type="color"
          value={tag.colorHex}
          onPointerDown={(e) => e.stopPropagation()}
          onInput={(e) => onColorInput(e.currentTarget.value)}
          onChange={(e) => onColorCommit(e.currentTarget.value)}
          className="sr-only"
          tabIndex={-1}
        />

        {/* Pin handle: drag to place, or tap to arm tap-to-place */}
        <button
          type="button"
          onPointerDown={onHandlePointerDown}
          aria-label={t("placePin")}
          title={t("placePin")}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-opacity hover:opacity-80"
          style={{
            background: awaitingPin ? "var(--accent-primary)" : "var(--bg-tertiary)",
            color:      awaitingPin ? "var(--bg-primary)"     : "var(--text-muted)",
            cursor: "crosshair",
            touchAction: "none",
          }}
        >
          <Crosshair size={13} />
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          aria-label={t("delete")}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
        >
          <X size={13} />
        </button>
      </div>

      <textarea
        value={text}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        onBlur={() => { if (text !== tag.content) onContentCommit(text); }}
        placeholder={t("placeholder")}
        rows={2}
        className="w-full px-2 py-1.5 rounded text-xs outline-none resize-none"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}
