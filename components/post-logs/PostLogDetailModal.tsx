"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";
import { PostLog } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import ImageLightbox, { LightboxImage } from "@/components/ui/ImageLightbox";
import PostLogLikeButton from "./PostLogLikeButton";

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)          return `${Math.floor(diff)}s`;
  if (diff < 3600)        return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Props = {
  log: PostLog;
  isOwner: boolean;
  onClose: () => void;
  onRequestEdit: () => void;
  onRequestDelete: () => void;
};

export default function PostLogDetailModal({ log, isOwner, onClose, onRequestEdit, onRequestDelete }: Props) {
  const locale = useLocale();
  const isJa   = locale === "ja";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages: LightboxImage[] = log.imageUrls.map((url) => ({ url }));

  return (
    <>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
            aria-label={isJa ? "閉じる" : "Close"}
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <Link href={`/profile/${log.author.username}`} className="shrink-0">
              <div className="relative w-11 h-11 rounded-full overflow-hidden">
                <UserAvatar src={log.author.avatarUrl} alt={log.author.name} fill />
              </div>
            </Link>
            <div className="min-w-0">
              <Link
                href={`/profile/${log.author.username}`}
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {log.author.name}
              </Link>
              <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                @{log.author.username} · {relativeTime(log.createdAt)}
              </p>
            </div>

            {isOwner && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRequestEdit}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  aria-label={isJa ? "編集" : "Edit"}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={onRequestDelete}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  aria-label={isJa ? "削除" : "Delete"}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {log.content}
          </p>

          {log.imageUrls.length > 0 && (
            <div className={log.imageUrls.length > 1 ? "grid grid-cols-2 gap-2" : ""}>
              {log.imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative rounded-lg overflow-hidden transition-opacity hover:opacity-90"
                  style={{ aspectRatio: "1/1", background: "var(--bg-tertiary)" }}
                >
                  <Image src={url} alt="" fill sizes="480px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {log.linkedPost && (
            <Link
              href={`/posts/${log.linkedPost.id}`}
              className="flex items-center gap-2 pr-3 rounded-lg w-fit max-w-full transition-opacity hover:opacity-80"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
            >
              {log.linkedPost.thumbnailUrl && (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <Image src={log.linkedPost.thumbnailUrl} alt="" fill sizes="32px" className="object-cover" />
                </div>
              )}
              <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                {log.linkedPost.title}
              </span>
            </Link>
          )}

          <PostLogLikeButton postLogId={log.id} count={log.likeCount} />
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
