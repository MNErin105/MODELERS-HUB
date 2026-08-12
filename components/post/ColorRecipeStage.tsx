"use client";

import { useCallback, useEffect, useRef, useState, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import ColorRecipeTagBox from "./ColorRecipeTagBox";

// Only what the stage needs to draw and manipulate a tag. Both the saved
// ColorRecipeTag and the draft tags in the post form satisfy this.
export type StageTag = {
  id: string;
  pin: { x: number; y: number };
  box: { x: number; y: number };
  colorHex: string;
  content: string;
};

export type StageTagChanges = Partial<Pick<StageTag, "pin" | "box" | "colorHex" | "content">>;

type Props = {
  imageUrl: string;
  tags: StageTag[];
  editing: boolean;
  /** Draft previews are blob: URLs, which the image optimiser can't handle. */
  unoptimized?: boolean;
  /**
   * `commit` is false for the intermediate frames of a gesture and true at the
   * end of it — a DB-backed caller writes only on commit, a draft caller can
   * ignore the flag entirely.
   */
  onTagChange?: (tagId: string, changes: StageTagChanges, commit: boolean) => void;
  /** Returns the new tag's id so the stage can arm pin placement for it. */
  onAdd?: () => Promise<string | null>;
  onDelete?: (tagId: string) => void;
};

// What the pointer is currently moving. `pin` also covers dragging straight
// out of a box's handle, which is how a new pin gets placed.
type Drag =
  | { kind: "box"; tagId: string; moved: boolean }
  | { kind: "pin"; tagId: string; moved: boolean; at: { x: number; y: number } }
  | null;

type ContentRect = { left: number; top: number; width: number; height: number };

const TAP_SLOP = 6; // px of movement below which a drag counts as a tap
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function ColorRecipeStage({
  imageUrl, tags, editing, unoptimized, onTagChange, onAdd, onDelete,
}: Props) {
  const t = useTranslations("post.colorRecipe");

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [rect,    setRect]    = useState<ContentRect | null>(null);
  const [drag,    setDrag]    = useState<Drag>(null);
  const [awaitingPinFor, setAwaitingPinFor] = useState<string | null>(null);
  const [adding,  setAdding]  = useState(false);

  const stageRef  = useRef<HTMLDivElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // The photo is drawn object-contain (never cropped), so every stored 0-1
  // coordinate maps to a visible point. Recompute the letterbox on resize.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !natural) return;

    const compute = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw === 0 || ch === 0) return;
      const aspect = natural.w / natural.h;
      let width  = cw;
      let height = cw / aspect;
      if (height > ch) { height = ch; width = ch * aspect; }
      setRect({ left: (cw - width) / 2, top: (ch - height) / 2, width, height });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natural]);

  // Escape cancels an armed pin before anything else handles the key.
  useEffect(() => {
    if (!awaitingPinFor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setAwaitingPinFor(null);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [awaitingPinFor]);

  const toPx = useCallback(
    (x: number, y: number) =>
      rect ? { x: rect.left + x * rect.width, y: rect.top + y * rect.height } : { x: 0, y: 0 },
    [rect],
  );

  // Pointer position -> 0-1 coordinates, clamped so we never produce values
  // the column CHECK constraints would reject.
  const toNorm = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || !rect) return { x: 0, y: 0 };
      const box = stage.getBoundingClientRect();
      return {
        x: clamp01((clientX - box.left - rect.left) / rect.width),
        y: clamp01((clientY - box.top  - rect.top)  / rect.height),
      };
    },
    [rect],
  );

  // ── Colour sampling ────────────────────────────────────────────────────
  // Both sources are same-origin — /_next/image for saved posts, blob: for
  // drafts — so the canvas stays untainted and getImageData works without
  // any CORS setup.
  const sampleColor = useCallback((nx: number, ny: number): string | null => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return null;
    try {
      if (!canvasRef.current) {
        const c = document.createElement("canvas");
        c.width  = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d", { willReadFrequently: true })?.drawImage(img, 0, 0);
        canvasRef.current = c;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      const cx = Math.round(nx * canvas.width);
      const cy = Math.round(ny * canvas.height);
      const x0 = Math.max(0, Math.min(canvas.width  - 5, cx - 2));
      const y0 = Math.max(0, Math.min(canvas.height - 5, cy - 2));
      const { data } = ctx.getImageData(x0, y0, 5, 5);

      let r = 0, g = 0, b = 0;
      const px = data.length / 4;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
      return "#" + [r, g, b].map((v) => Math.round(v / px).toString(16).padStart(2, "0")).join("");
    } catch {
      // Tainted canvas or an image that never decoded — keep the old colour.
      return null;
    }
  }, []);

  // ── Gestures ───────────────────────────────────────────────────────────

  function startBoxDrag(tagId: string, e: ReactPointerEvent) {
    if (!editing) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ kind: "box", tagId, moved: false });
  }

  function startPinDrag(tagId: string, e: ReactPointerEvent) {
    if (!editing) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ kind: "pin", tagId, moved: false, at: toNorm(e.clientX, e.clientY) });
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!drag) return;
    const movedEnough =
      Math.abs(e.clientX - dragStart.current.x) > TAP_SLOP ||
      Math.abs(e.clientY - dragStart.current.y) > TAP_SLOP;
    const at = toNorm(e.clientX, e.clientY);

    if (drag.kind === "box") {
      onTagChange?.(drag.tagId, { box: at }, false);
      if (movedEnough && !drag.moved) setDrag({ ...drag, moved: true });
      return;
    }
    setDrag({ ...drag, moved: drag.moved || movedEnough, at });
  }

  function placePin(tagId: string, at: { x: number; y: number }) {
    const colorHex = sampleColor(at.x, at.y);
    onTagChange?.(tagId, { pin: at, ...(colorHex ? { colorHex } : {}) }, true);
  }

  function handlePointerUp(e: ReactPointerEvent) {
    if (!drag) return;
    const at = toNorm(e.clientX, e.clientY);

    if (drag.kind === "box") {
      if (drag.moved) onTagChange?.(drag.tagId, { box: at }, true);
      setDrag(null);
      return;
    }

    // A tap on the handle (no real movement) arms tap-to-place rather than
    // dropping the pin under the finger — the mobile flow.
    if (!drag.moved) {
      setAwaitingPinFor(drag.tagId);
    } else {
      placePin(drag.tagId, at);
      setAwaitingPinFor(null);
    }
    setDrag(null);
  }

  // Tap on the photo while armed -> place that tag's pin there.
  function handleStagePointerDown(e: ReactPointerEvent) {
    if (!editing || !awaitingPinFor) return;
    placePin(awaitingPinFor, toNorm(e.clientX, e.clientY));
    setAwaitingPinFor(null);
  }

  async function handleAdd() {
    if (!onAdd || adding) return;
    setAdding(true);
    try {
      const newId = await onAdd();
      if (newId) setAwaitingPinFor(newId);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      ref={stageRef}
      className="relative flex-1 min-h-0"
      onPointerDown={handleStagePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
      style={{
        touchAction: editing ? "none" : undefined,
        cursor: editing && awaitingPinFor ? "crosshair" : undefined,
      }}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="100vw"
        unoptimized={unoptimized}
        className="object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          imgRef.current = img;
          canvasRef.current = null; // re-draw against the new image
          setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        }}
      />

      {editing && onAdd && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleAdd}
          disabled={adding}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          <Plus size={13} /> {t("add")}
        </button>
      )}

      {editing && awaitingPinFor && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(17,17,20,0.92)", color: "var(--accent-primary)" }}
          >
            {t("tapToPlace")}
          </span>
        </div>
      )}

      {rect && (
        <>
          {/* Lines in one SVG layer; pins and boxes are HTML on top. */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            {tags.map((tag) => {
              const live = drag?.kind === "pin" && drag.tagId === tag.id ? drag.at : tag.pin;
              const pin = toPx(live.x, live.y);
              const box = toPx(tag.box.x, tag.box.y);
              return (
                <line
                  key={tag.id}
                  x1={pin.x} y1={pin.y} x2={box.x} y2={box.y}
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>

          {tags.map((tag) => {
            const live = drag?.kind === "pin" && drag.tagId === tag.id ? drag.at : tag.pin;
            const pin = toPx(live.x, live.y);
            return (
              <span
                key={`pin-${tag.id}`}
                onPointerDown={(e) => startPinDrag(tag.id, e)}
                className="absolute rounded-full"
                style={{
                  left: pin.x, top: pin.y,
                  width:  editing ? 16 : 12,
                  height: editing ? 16 : 12,
                  transform: "translate(-50%, -50%)",
                  background: tag.colorHex,
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                  cursor: editing ? "grab" : "default",
                  pointerEvents: editing ? "auto" : "none",
                  touchAction: "none",
                }}
              />
            );
          })}

          {tags.map((tag) => {
            const box = toPx(tag.box.x, tag.box.y);
            return (
              <ColorRecipeTagBox
                key={`box-${tag.id}`}
                tag={tag}
                x={box.x}
                y={box.y}
                editing={editing}
                awaitingPin={awaitingPinFor === tag.id}
                onBoxPointerDown={(e) => startBoxDrag(tag.id, e)}
                onHandlePointerDown={(e) => startPinDrag(tag.id, e)}
                onColorInput={(hex) => onTagChange?.(tag.id, { colorHex: hex }, false)}
                onColorCommit={(hex) => onTagChange?.(tag.id, { colorHex: hex }, true)}
                onContentCommit={(text) => onTagChange?.(tag.id, { content: text }, true)}
                onDelete={() => onDelete?.(tag.id)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
