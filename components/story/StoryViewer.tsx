"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import UserAvatar from "@/components/ui/UserAvatar";
import { Story } from "@/lib/types";
import { deleteStory } from "@/lib/supabase/storiesQueries";
import { useAuth } from "@/lib/context/AuthContext";

type Props = {
  stories: Story[];
  startIndex?: number;
  onClose: () => void;
  onDeleted?: (storyId: string) => void;
};

const DURATION_MS = 5000;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

function touchDist(t0: Touch, t1: Touch): number {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

export default function StoryViewer({ stories, startIndex = 0, onClose, onDeleted }: Props) {
  const t = useTranslations("story");
  const { user } = useAuth();

  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt   = useRef(Date.now());
  const elapsed     = useRef(0);
  const pausedRef   = useRef(false);

  const story   = stories[index];
  const isOwner = user?.id === story?.userId;

  // ── Zoom / pan — driven via refs directly into the DOM ───────────────────
  // storyCardRef  → touch listener target (parent of buttons; lets isGestureActive
  //                 guard skip button touches before any preventDefault is called)
  // containerRef  → image container; used only for clampPan dimension lookup
  // imgWrapRef    → receives CSS transform; has touch-action:none so iOS Safari
  //                 correctly generates click events for sibling buttons
  const storyCardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgWrapRef   = useRef<HTMLDivElement>(null);
  const scaleRef     = useRef(1);
  const panXRef      = useRef(0);
  const panYRef      = useRef(0);

  function applyTransform(s: number, x: number, y: number, animated = false) {
    const el = imgWrapRef.current;
    if (!el) return;
    el.style.transition = animated ? "transform 0.2s ease" : "none";
    el.style.transform  = `translate(${x}px, ${y}px) scale(${s})`;
    scaleRef.current = s;
    panXRef.current  = x;
    panYRef.current  = y;
  }

  function resetZoom(animated = false) {
    applyTransform(MIN_SCALE, 0, 0, animated);
  }

  function clampPan(s: number, x: number, y: number): { x: number; y: number } {
    const el = containerRef.current;
    if (!el) return { x, y };
    const maxX = (s - 1) * el.clientWidth  / 2;
    const maxY = (s - 1) * el.clientHeight / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  // Keep tick logic in a ref so resumeTimer always calls the current version
  const tickFnRef = useRef<() => void>(() => {});
  tickFnRef.current = () => {
    const spent = Date.now() - startedAt.current + elapsed.current;
    const pct   = Math.min(spent / DURATION_MS, 1);
    setProgress(pct);
    if (pct >= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      goNextCb.current();
    }
  };

  function pauseTimer() {
    if (pausedRef.current) return;
    elapsed.current += Date.now() - startedAt.current;
    if (timerRef.current) clearInterval(timerRef.current);
    pausedRef.current = true;
  }

  function resumeTimer() {
    if (!pausedRef.current) return;
    startedAt.current  = Date.now();
    timerRef.current   = setInterval(() => tickFnRef.current(), 50);
    pausedRef.current  = false;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  // Stable refs so touch handlers (captured in useEffect) always have latest
  const goNextCb = useRef<() => void>(() => {});
  const goPrevCb = useRef<() => void>(() => {});

  const goNext = useCallback(() => {
    resetZoom();
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    resetZoom();
    if (index > 0) setIndex((i) => i - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => { goNextCb.current = goNext; }, [goNext]);
  useEffect(() => { goPrevCb.current = goPrev; }, [goPrev]);

  // Auto-advance timer; reset on each story change
  useEffect(() => {
    elapsed.current   = 0;
    startedAt.current = Date.now();
    setProgress(0);
    pausedRef.current = false;
    timerRef.current  = setInterval(() => tickFnRef.current(), 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [index]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  goNextCb.current();
      if (e.key === "ArrowLeft")   goPrevCb.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Touch gestures ────────────────────────────────────────────────────────
  const lastTapTime     = useRef(0);
  const pinchStartDist  = useRef(0);
  const pinchStartScale = useRef(1);
  const dragStartPanX   = useRef(0);
  const dragStartPanY   = useRef(0);
  const touchStartX     = useRef(0);
  const touchStartY     = useRef(0);
  const isPinching      = useRef(false);
  const isDragging      = useRef(false);
  // Set to false when the touch lands on a button/link so move+end handlers skip it
  const isGestureActive = useRef(false);

  useEffect(() => {
    // Register on the story-card div (ancestor of ALL elements including buttons).
    // The isGestureActive guard bails out before any preventDefault() when the
    // touch target is a button, so button clicks always reach their onClick handlers.
    const el = storyCardRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      // ── Skip gesture handling when touching a button / link / icon ───
      // Without this guard, preventDefault() blocks the click event on
      // the delete and close buttons that float above the image container.
      const target = e.target as Element;
      if (target.closest("button, a, [role='button']")) {
        isGestureActive.current = false;
        return;
      }
      isGestureActive.current = true;

      // ── Two-finger pinch ─────────────────────────────────────────────
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current    = true;
        isDragging.current    = false;
        pinchStartDist.current  = touchDist(e.touches[0], e.touches[1]);
        pinchStartScale.current = scaleRef.current;
        pauseTimer();
        return;
      }

      // ── Single finger ────────────────────────────────────────────────
      const touch = e.touches[0];
      touchStartX.current   = touch.clientX;
      touchStartY.current   = touch.clientY;
      dragStartPanX.current = panXRef.current;
      dragStartPanY.current = panYRef.current;
      isPinching.current    = false;
      isDragging.current    = false;
      pauseTimer();

      // Double-tap: toggle 1x ↔ 2x
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        e.preventDefault();
        if (scaleRef.current > 1.1) {
          resetZoom(true);
        } else {
          applyTransform(2, 0, 0, true);
        }
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!isGestureActive.current) return;

      // ── Pinch zoom ───────────────────────────────────────────────────
      if (e.touches.length === 2 && isPinching.current) {
        e.preventDefault();
        const d        = touchDist(e.touches[0], e.touches[1]);
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
          pinchStartScale.current * (d / pinchStartDist.current),
        ));
        const { x, y } = clampPan(newScale, panXRef.current, panYRef.current);
        applyTransform(newScale, x, y);
        return;
      }

      // ── Drag-to-pan (only while zoomed) ─────────────────────────────
      if (e.touches.length === 1 && !isPinching.current && scaleRef.current > 1.01) {
        e.preventDefault();
        isDragging.current = true;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        const { x, y } = clampPan(
          scaleRef.current,
          dragStartPanX.current + dx,
          dragStartPanY.current + dy,
        );
        applyTransform(scaleRef.current, x, y);
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!isGestureActive.current) return;

      // Pinch released
      if (isPinching.current) {
        if (e.touches.length < 2) {
          isPinching.current = false;
          // Snap back if barely zoomed
          if (scaleRef.current < 1.05) resetZoom(true);
          resumeTimer();
        }
        return;
      }

      if (e.touches.length > 0) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;

      // Horizontal swipe nav — only at 1× and only when not dragging
      if (!isDragging.current && scaleRef.current <= 1.01) {
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          dx < 0 ? goNextCb.current() : goPrevCb.current();
          return;
        }
      }

      isDragging.current = false;
      resumeTimer();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [index]); // re-register when story changes so clampPan sees fresh container size

  // Always reset zoom on story change (covers keyboard nav too)
  useEffect(() => { resetZoom(); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete ────────────────────────────────────────────────────────────────
  function requestDelete() {
    pauseTimer();
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    setShowDeleteConfirm(false);
    try {
      await deleteStory(story);
      onDeleted?.(story.id);
      if (stories.length <= 1) {
        onClose();
      } else if (index >= stories.length - 1) {
        setIndex((i) => i - 1);
      }
    } catch { /* best effort */ }
  }

  function cancelDelete() {
    setShowDeleteConfirm(false);
    resumeTimer();
  }

  function expiresLabel(): string {
    const msLeft     = new Date(story.expiresAt).getTime() - Date.now();
    const minutesLeft = Math.floor(msLeft / 60000);
    if (minutesLeft < 1)  return t("expiresSoon");
    if (minutesLeft < 60) return t("expiresInMinutes", { minutes: minutesLeft });
    return t("expiresInHours", { hours: Math.floor(minutesLeft / 60) });
  }

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* ── Story card ─────────────────────────────────────────────────── */}
      <div
        ref={storyCardRef}
        className="relative"
        style={{ width: "min(100vw, 400px)", height: "min(100vh, 710px)", maxHeight: "100dvh" }}
      >
        {/* Image container — dimension reference for clampPan, mouse pause/resume */}
        <div
          ref={containerRef}
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ background: "#000" }}
          onMouseDown={() => pauseTimer()}
          onMouseUp={() => resumeTimer()}
        >
          {/* Zoom / pan wrapper — transform applied here.
              touch-action:none is scoped to the image area only, so iOS Safari
              still generates click events for the sibling header buttons. */}
          <div
            ref={imgWrapRef}
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: "center",
              willChange: "transform",
              touchAction: "none",
            }}
          >
            <Image
              key={story.id}
              src={story.imageUrl}
              alt={story.caption ?? "Story"}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>

          {/* Caption */}
          {story.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-6 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
            >
              <p className="text-sm text-center" style={{ color: "white", lineHeight: 1.5 }}>
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1 pointer-events-none">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 2, background: "rgba(255,255,255,0.35)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                  background: "rgba(255,255,255,0.9)",
                  transition: "width 50ms linear",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <UserAvatar src={story.author.avatarUrl ?? ""} alt={story.author.name} fill />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "white" }}>
              {story.author.name}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>
              {expiresLabel()}
            </p>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={requestDelete}
              className="p-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "rgba(0,0,0,0.5)" }}
              aria-label="Delete story"
            >
              <Trash2 size={14} color="white" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(0,0,0,0.5)" }}
            aria-label={t("close")}
          >
            <X size={14} color="white" />
          </button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.75)" }}
          >
            <div
              className="w-full max-w-xs rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-sm font-semibold text-center" style={{ color: "var(--text-primary)" }}>
                {t("deleteConfirmTitle")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  {t("deleteCancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  {t("deleteConfirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop tap zones (hidden on mobile — touch handles it).
            z-[5] keeps these below the header (z-10) so the delete / close
            buttons are never occluded by the invisible tap zone overlay. */}
        <button
          type="button"
          className="absolute left-0 top-0 bottom-0 w-1/3 z-[5] opacity-0 hidden md:block"
          onClick={() => goPrevCb.current()}
          aria-label="Previous"
        />
        <button
          type="button"
          className="absolute right-0 top-0 bottom-0 w-1/3 z-[5] opacity-0 hidden md:block"
          onClick={() => goNextCb.current()}
          aria-label="Next"
        />
      </div>

      {/* Desktop arrows */}
      {index > 0 && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center transition-opacity hover:opacity-80 hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onClick={() => goPrevCb.current()}
        >
          <ChevronLeft size={20} color="white" />
        </button>
      )}
      {index < stories.length - 1 && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center transition-opacity hover:opacity-80 hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onClick={() => goNextCb.current()}
        >
          <ChevronRight size={20} color="white" />
        </button>
      )}
    </div>
  );
}
