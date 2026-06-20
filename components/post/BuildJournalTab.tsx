"use client";

import { useState } from "react";
import Image from "next/image";
import { BuildStep } from "@/lib/types";
import { BookOpen } from "lucide-react";
import ImageLightbox, { LightboxImage } from "@/components/ui/ImageLightbox";

type Props = { steps: BuildStep[] };

type LightboxState = { images: LightboxImage[]; startIndex: number };

export default function BuildJournalTab({ steps }: Props) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BookOpen size={48} style={{ color: "var(--text-muted)" }} />
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>No build journal yet.</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The builder hasn&apos;t added process notes to this work.
        </p>
      </div>
    );
  }

  function openLightbox(step: BuildStep, imgIndex: number) {
    setLightbox({
      images: step.images.map((img) => ({ url: img.url, caption: img.caption })),
      startIndex: imgIndex,
    });
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>
          Build Journal
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {steps.length} steps documented
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: "var(--border-subtle)" }}
        />

        <div className="flex flex-col gap-10">
          {steps.map((step) => (
            <div key={step.id} className="relative pl-14">
              {/* Step number badge */}
              <div
                className="absolute left-0 top-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10"
                style={{ background: "var(--bg-secondary)", border: "2px solid var(--accent-muted)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}
              >
                {step.stepNumber}
              </div>

              {/* Card */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                {/* Step header */}
                <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <time
                    className="text-xs shrink-0"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                    dateTime={step.date}
                  >
                    {new Date(step.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </time>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>

                {/* Images grid */}
                {step.images.length > 0 && (
                  <div className={`grid gap-3 ${step.images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
                    {step.images.map((img, i) => (
                      <figure key={i} className="flex flex-col gap-1">
                        <button
                          onClick={() => openLightbox(step, i)}
                          className="relative rounded-lg overflow-hidden w-full"
                          style={{ aspectRatio: "4/3", background: "var(--bg-tertiary)", cursor: "zoom-in" }}
                          aria-label={`View: ${img.caption}`}
                        >
                          <Image
                            src={img.url}
                            alt={img.caption}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover transition-transform duration-200 hover:scale-105"
                          />
                        </button>
                        <figcaption
                          className="text-xs leading-snug px-1"
                          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                        >
                          「{img.caption}」
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
