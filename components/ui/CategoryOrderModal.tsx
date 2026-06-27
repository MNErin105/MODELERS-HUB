"use client";

import { useMemo, useRef, useState } from "react";
import { GripVertical, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATEGORIES, Category } from "@/lib/types";

type Props = {
  order: Category[];
  onSave: (order: Category[]) => void;
  onReset: () => void;
  onClose: () => void;
};

export default function CategoryOrderModal({ order, onSave, onReset, onClose }: Props) {
  const t = useTranslations("categoryOrder");
  const tc = useTranslations("category");

  const [items, setItems] = useState<Category[]>(order);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  // Refs hold the current drag state without stale-closure issues
  const draggingRef = useRef<number | null>(null);
  const overRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Show live reorder while dragging: move items[dragging] to position 'over'
  const displayItems = useMemo(() => {
    if (dragging === null || over === null || dragging === over) return items;
    const next = [...items];
    const [moved] = next.splice(dragging, 1);
    next.splice(over, 0, moved);
    return next;
  }, [items, dragging, over]);

  function getIndexFromPoint(clientY: number): number {
    if (!listRef.current) return 0;
    const children = Array.from(listRef.current.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return Math.max(0, children.length - 1);
  }

  function startDrag(e: React.PointerEvent, i: number) {
    e.preventDefault();
    // Capture pointer to the list so pointermove/pointerup fire there
    listRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = i;
    overRef.current = i;
    setDragging(i);
    setOver(i);
  }

  function onListPointerMove(e: React.PointerEvent) {
    if (draggingRef.current === null) return;
    const idx = getIndexFromPoint(e.clientY);
    overRef.current = idx;
    setOver(idx);
  }

  function onListPointerUp() {
    if (draggingRef.current !== null) {
      const from = draggingRef.current;
      const to = overRef.current ?? from;
      if (from !== to) {
        setItems((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
      }
    }
    draggingRef.current = null;
    overRef.current = null;
    setDragging(null);
    setOver(null);
  }

  function handleReset() {
    setItems(CATEGORIES);
    onReset();
  }

  function handleSave() {
    onSave(items);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          maxHeight: "85dvh",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("modalTitle")}
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded-lg transition-opacity hover:opacity-70">
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <p className="px-4 pt-3 pb-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {t("hint")}
        </p>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1.5"
          onPointerMove={onListPointerMove}
          onPointerUp={onListPointerUp}
          onPointerCancel={onListPointerUp}
          style={{ touchAction: dragging !== null ? "none" : undefined }}
        >
          {displayItems.map((cat, i) => {
            const isDragging = dragging !== null && cat === items[dragging];
            return (
              <div
                key={cat}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl select-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  opacity: isDragging ? 0.4 : 1,
                  cursor: isDragging ? "grabbing" : "default",
                }}
              >
                <div
                  className="shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => startDrag(e, i)}
                >
                  <GripVertical size={16} style={{ color: "var(--text-muted)" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {tc(`names.${cat.replace(/\s+/g, "_")}`)}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="flex gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <RotateCcw size={13} />
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
