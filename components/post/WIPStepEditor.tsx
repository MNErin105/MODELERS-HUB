"use client";

import { ChangeEvent, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadedImage } from "./ImagePreviewGrid";
import { isImageFile } from "@/lib/imageUtils";

export type WIPStep = {
  id: string;
  title: string;
  description: string;
  images: UploadedImage[];
};

type Props = {
  steps: WIPStep[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdateField: (id: string, field: "title" | "description", value: string) => void;
  onAddImages: (stepId: string, files: File[]) => void;
  onRemoveImage: (stepId: string, imgId: string) => void;
};

export default function WIPStepEditor({ steps, onAdd, onRemove, onUpdateField, onAddImages, onRemoveImage }: Props) {
  const t = useTranslations("newPost");

  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, i) => (
        <StepCard
          key={step.id}
          step={step}
          index={i}
          onRemove={() => onRemove(step.id)}
          onUpdateField={(field, val) => onUpdateField(step.id, field, val)}
          onAddImages={(files) => onAddImages(step.id, files)}
          onRemoveImage={(imgId) => onRemoveImage(step.id, imgId)}
        />
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
        style={{
          border: "1px dashed var(--border-muted)",
          color: "var(--accent-primary)",
          background: "transparent",
        }}
      >
        <Plus size={16} /> {t("wip.addStep")}
      </button>
    </div>
  );
}

type CardProps = {
  step: WIPStep;
  index: number;
  onRemove: () => void;
  onUpdateField: (field: "title" | "description", value: string) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imgId: string) => void;
};

function StepCard({ step, index, onRemove, onUpdateField, onAddImages, onRemoveImage }: CardProps) {
  const t = useTranslations("newPost");
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = 5 - step.images.length;

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files)
      .filter(isImageFile)
      .slice(0, remaining);
    if (files.length > 0) onAddImages(files);
    e.target.value = "";
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Step header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--accent-muted)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
        >
          {index + 1}
        </div>
        <input
          type="text"
          value={step.title}
          onChange={(e) => onUpdateField("title", e.target.value)}
          placeholder={t("wip.stepTitle", { n: index + 1 })}
          className="flex-1 bg-transparent text-sm font-semibold outline-none border-b pb-0.5"
          style={{ color: "var(--text-primary)", borderColor: "var(--border-subtle)" }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
          style={{ color: "var(--text-muted)" }}
          aria-label={t("wip.removeStep")}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Description */}
      <textarea
        value={step.description}
        onChange={(e) => onUpdateField("description", e.target.value)}
        placeholder={t("wip.stepDesc")}
        rows={2}
        className="w-full bg-transparent text-sm outline-none resize-none rounded-lg p-2"
        style={{
          color: "var(--text-secondary)",
          border: "1px solid var(--border-subtle)",
          lineHeight: 1.6,
        }}
      />

      {/* Step images */}
      {step.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.images.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg overflow-hidden"
              style={{ width: 72, height: 72, background: "var(--bg-tertiary)" }}
            >
              <Image src={img.url} alt={img.caption || "Step image"} fill className="object-cover" sizes="72px" unoptimized />
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                aria-label={t("image.remove")}
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add step images */}
      {remaining > 0 && (
        <>
          <input ref={inputRef} type="file" accept="image/*,image/heic,image/heif" multiple className="sr-only" onChange={handleFiles} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg w-fit transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <ImagePlus size={13} /> {t("wip.addPhotos", { remaining })}
          </button>
        </>
      )}
    </div>
  );
}
