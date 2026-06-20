"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = {
  url: string;
  caption?: string;
  /** Shown only in the fullscreen lightbox, not in feed/gallery thumbnails. */
  authorComment?: string | null;
};

type Props = {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
};

export default function ImageLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [show,  setShow]  = useState(false);
  const [scale, setScale] = useState(1);

  const imgZone    = useRef<HTMLDivElement>(null);
  const touchX     = useRef(0);
  const touchY     = useRef(0);
  const lastTap    = useRef(0);
  const pinchDist  = useRef(0);
  const pinchScale = useRef(1);

  // Fade in
  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  const jump = (i: number) => { setIndex(i); setScale(1); };
  const prev = useCallback(() => jump((index - 1 + images.length) % images.length), [index, images.length]);
  const next = useCallback(() => jump((index + 1) % images.length), [index, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape")     dismiss();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [dismiss, prev, next]);

  // Non-passive touchmove needed for pinch zoom
  useEffect(() => {
    const el = imgZone.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchX.current = e.touches[0].clientX;
      touchY.current = e.touches[0].clientY;
      const now = Date.now();
      if (now - lastTap.current < 280) {
        setScale(s => (s > 1 ? 1 : 2.5));
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchDist.current  = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchScale.current = scale;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setScale(Math.min(5, Math.max(1, pinchScale.current * (d / pinchDist.current))));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1.05 || images.length <= 1 || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      dx < 0 ? next() : prev();
    }
  };

  const img = images[index];
  const hasComment = !!img.authorComment;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.93)",
        display: "flex", flexDirection: "column",
        opacity: show ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* ── Close button ─────────────────────────────────────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Close"
        style={overlayBtn({ position: "absolute", top: 14, right: 14, zIndex: 10 })}
      >
        <X size={18} />
      </button>

      {/* ── Navigation arrows ────────────────────────────────────────────────── */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous image"
            style={overlayBtn({ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", zIndex: 10 })}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next image"
            style={overlayBtn({ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", zIndex: 10 })}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* ── Top spacer (keeps image below the close button) ──────────────────── */}
      <div style={{ flexShrink: 0, height: 56 }} />

      {/* ── Image zone ───────────────────────────────────────────────────────── */}
      <div
        ref={imgZone}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: "1 1 0",
          minHeight: 0,
          position: "relative",
          transform: `scale(${scale})`,
          transition: scale === 1 ? "transform 0.2s ease" : "none",
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      >
        <Image
          key={img.url}
          src={img.url}
          alt={img.caption ?? ""}
          fill
          priority
          sizes="min(90vw, 1400px)"
          style={{ objectFit: "contain" }}
          unoptimized
        />
      </div>

      {/* ── Bottom bar: author comment + caption + counter ───────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flexShrink: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: hasComment ? "14px 20px 16px" : "0 20px",
        }}
      >
        {/* Author comment — fullscreen only */}
        {hasComment && (
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.75,
              marginBottom: 10,
              // Cap at ~4 lines on small screens, scroll for longer comments
              maxHeight: "7em",
              overflowY: "auto",
              // Prevent layout shift from very long comments
              wordBreak: "break-word",
            }}
          >
            {img.authorComment}
          </p>
        )}

        {/* Caption + counter row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: 44,
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-mono)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {img.caption}
          </span>
          {images.length > 1 && (
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              {index + 1} / {images.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function overlayBtn(pos: React.CSSProperties): React.CSSProperties {
  return {
    width: 40, height: 40, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff", cursor: "pointer",
    ...pos,
  };
}
