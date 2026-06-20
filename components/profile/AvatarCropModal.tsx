"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { X, Check, Loader2, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  /** object URL created from the user-selected File */
  imageSrc: string;
  onApply:  (file: File) => void;
  onCancel: () => void;
};

// ── Canvas crop helper ────────────────────────────────────────────────────────

async function cropImageToBlob(
  src: string,
  pixelCrop: Area,
  outputSize = 400,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, outputSize, outputSize,
      );
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")),
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function AvatarCropModal({ imageSrc, onApply, onCancel }: Props) {
  const [crop, setCrop]                         = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom]                         = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying]                 = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, 400);
      onApply(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    } catch (err) {
      console.error("[AvatarCropModal] crop failed:", err);
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.78)" }}
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Crop Photo
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <X size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* ── Crop canvas ── */}
        <div className="relative" style={{ height: 320, background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            // satisfy required props that have defaultProps
            rotation={0}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.1}
            restrictPosition={true}
            keyboardStep={1}
            style={{
              containerStyle: { background: "#111" },
              cropAreaStyle:  {
                border:     "2.5px solid rgba(255,255,255,0.85)",
                boxShadow:  "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
            classes={{}}
            mediaProps={{}}
            cropperProps={{}}
          />
        </div>

        {/* ── Zoom slider ── */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <ZoomOut
              size={14}
              aria-hidden="true"
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--accent-primary)", cursor: "pointer" }}
              aria-label="Zoom"
            />
            <ZoomIn
              size={14}
              aria-hidden="true"
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
            Drag to reposition · Pinch or scroll to zoom
          </p>
        </div>

        {/* ── Actions ── */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--bg-tertiary)",
              color:      "var(--text-secondary)",
              border:     "1px solid var(--border-subtle)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={applying || !croppedAreaPixels}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            {applying
              ? <Loader2 size={14} className="animate-spin" />
              : <Check size={14} />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
