"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { url: string; caption?: string };

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
      // Double-tap to zoom
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
    // Swipe to navigate — only when not zoomed
    if (scale > 1.05 || images.length <= 1 || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      dx < 0 ? next() : prev();
    }
  };

  const img = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0, 0, 0, 0.93)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* ── Close button ─────────────────────────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Close"
        style={overlayBtn({ top: 14, right: 14 })}
      >
        <X size={18} />
      </button>

      {/* ── Navigation arrows ────────────────────────────────────── */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous image"
            style={overlayBtn({ left: 14, top: "50%", transform: "translateY(-50%)" })}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next image"
            style={overlayBtn({ right: 14, top: "50%", transform: "translateY(-50%)" })}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* ── Image zone ───────────────────────────────────────────── */}
      <div
        ref={imgZone}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: "min(90vw, 1400px)",
          height: "calc(100dvh - 96px)",
          transform: `translate(-50%, -50%) scale(${scale})`,
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
        />
      </div>

      {/* ── Bottom bar: caption + counter ────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          height: 48,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
        }}
      >
        <span
          style={{
            fontSize: 13, color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--font-mono)",
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {img.caption}
        </span>
        {images.length > 1 && (
          <span
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              fontFamily: "var(--font-mono)",
              flexShrink: 0, paddingLeft: 16,
            }}
          >
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

function overlayBtn(pos: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute", zIndex: 1,
    width: 40, height: 40, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff", cursor: "pointer",
    ...pos,
  };
}
