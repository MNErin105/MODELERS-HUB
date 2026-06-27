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

export default function StoryViewer({ stories, startIndex = 0, onClose, onDeleted }: Props) {
  const t = useTranslations("story");
  const { user } = useAuth();

  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(false);

  const story = stories[index];

  // Touch swipe
  const touchStartX = useRef(0);

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  // Progress timer
  useEffect(() => {
    elapsed.current = 0;
    startedAt.current = Date.now();
    setProgress(0);
    setPaused(false);

    timerRef.current = setInterval(() => {
      const spent = Date.now() - startedAt.current + elapsed.current;
      const pct = Math.min(spent / DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [index, goNext]);

  function pauseTimer() {
    if (paused) return;
    elapsed.current += Date.now() - startedAt.current;
    if (timerRef.current) clearInterval(timerRef.current);
    setPaused(true);
  }

  function resumeTimer() {
    if (!paused) return;
    startedAt.current = Date.now();
    timerRef.current = setInterval(() => {
      const spent = Date.now() - startedAt.current + elapsed.current;
      const pct = Math.min(spent / DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, 50);
    setPaused(false);
  }

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  async function handleDelete() {
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

  function expiresLabel(): string {
    const msLeft = new Date(story.expiresAt).getTime() - Date.now();
    const minutesLeft = Math.floor(msLeft / 60000);
    if (minutesLeft < 1) return t("expiresSoon");
    if (minutesLeft < 60) return t("expiresInMinutes", { minutes: minutesLeft });
    return t("expiresInHours", { hours: Math.floor(minutesLeft / 60) });
  }

  if (!story) return null;

  const isOwner = user?.id === story.userId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; pauseTimer(); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
        else resumeTimer();
      }}
      onMouseDown={pauseTimer}
      onMouseUp={resumeTimer}
    >
      {/* Story card */}
      <div
        className="relative flex flex-col"
        style={{ width: "min(100vw, 400px)", height: "min(100vh, 710px)", maxHeight: "100dvh" }}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
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

        {/* Header: avatar + name + time + close */}
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
              onClick={handleDelete}
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

        {/* Image */}
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <Image
            key={story.id}
            src={story.imageUrl}
            alt={story.caption ?? "Story"}
            fill
            className="object-cover"
            unoptimized
            priority
          />

          {/* Caption */}
          {story.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-6"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
            >
              <p className="text-sm text-center" style={{ color: "white", lineHeight: 1.5 }}>
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* Tap zones for prev/next (desktop) */}
        <button
          type="button"
          className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous"
        />
        <button
          type="button"
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next"
        />
      </div>

      {/* Desktop prev/next arrows */}
      {index > 0 && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onClick={goPrev}
        >
          <ChevronLeft size={20} color="white" />
        </button>
      )}
      {index < stories.length - 1 && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 hidden md:flex"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onClick={goNext}
        >
          <ChevronRight size={20} color="white" />
        </button>
      )}
    </div>
  );
}
