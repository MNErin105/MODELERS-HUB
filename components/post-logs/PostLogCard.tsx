"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { PostLog } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { deletePostLog } from "@/lib/supabase/postLogsQueries";
import UserAvatar from "@/components/ui/UserAvatar";
import ImageLightbox, { LightboxImage } from "@/components/ui/ImageLightbox";
import PostLogLikeButton from "./PostLogLikeButton";
import PostLogEditForm from "./PostLogEditForm";
import PostLogDetailModal from "./PostLogDetailModal";

const THUMB_SIZE   = 72;
// How far the back of the deck peeks out behind the front thumbnail.
const STACK_OFFSET = 7;

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
  onDeleted?: () => void;
  onUpdated?: (log: PostLog) => void;
};

export default function PostLogCard({ log: initialLog, onDeleted, onUpdated }: Props) {
  const locale = useLocale();
  const isJa   = locale === "ja";
  const { user } = useAuth();

  const [log,          setLog]          = useState(initialLog);
  const [isDeleted,     setIsDeleted]     = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [detailOpen,    setDetailOpen]    = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  const isOwner = !!user && user.id === log.author.id;
  const lightboxImages: LightboxImage[] = log.imageUrls.map((url) => ({ url }));

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePostLog(log.id, log.imageUrls);
      setIsDeleted(true);
      onDeleted?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : (isJa ? "削除に失敗しました" : "Failed to delete."));
      setDeleting(false);
    }
  }

  function handleSaved(updated: PostLog) {
    setLog(updated);
    setEditing(false);
    onUpdated?.(updated);
  }

  if (isDeleted) return null;

  if (editing) {
    return <PostLogEditForm log={log} onCancel={() => setEditing(false)} onSaved={handleSaved} />;
  }

  return (
    <div
      className="relative flex gap-2.5 p-3 rounded-xl cursor-pointer transition-colors hover:opacity-95"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      onClick={() => setDetailOpen(true)}
    >
      <Link
        href={`/profile/${log.author.username}`}
        className="shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden">
          <UserAvatar src={log.author.avatarUrl} alt={log.author.name} fill />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/profile/${log.author.username}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--text-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {log.author.name}
          </Link>
          <span className="text-xs truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            @{log.author.username} · {relativeTime(log.createdAt)}
          </span>

          {isOwner && (
            <div className="ml-auto flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                aria-label={isJa ? "編集" : "Edit"}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                aria-label={isJa ? "削除" : "Delete"}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Body: text on the left, image stack on the right */}
        <div className="flex items-start gap-2.5 mt-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug whitespace-pre-wrap line-clamp-3" style={{ color: "var(--text-secondary)" }}>
              {log.content}
            </p>

            {log.linkedPost && (
              <Link
                href={`/posts/${log.linkedPost.id}`}
                className="flex items-center gap-1.5 mt-2 pr-2.5 rounded-lg w-fit max-w-full transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {log.linkedPost.thumbnailUrl && (
                  <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0">
                    <Image src={log.linkedPost.thumbnailUrl} alt="" fill sizes="24px" className="object-cover" />
                  </div>
                )}
                <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                  {log.linkedPost.title}
                </span>
              </Link>
            )}

            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <PostLogLikeButton postLogId={log.id} count={log.likeCount} />
            </div>
          </div>

          {log.imageUrls.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); }}
              className="relative shrink-0 transition-opacity hover:opacity-90"
              style={{
                width:  THUMB_SIZE + (log.imageUrls.length > 1 ? STACK_OFFSET : 0),
                height: THUMB_SIZE + (log.imageUrls.length > 1 ? STACK_OFFSET : 0),
              }}
              aria-label={isJa ? "画像を拡大" : "View image"}
            >
              {/* Back of the deck — decorative; the whole stack is one target. */}
              {log.imageUrls.length > 1 && (
                <span
                  aria-hidden
                  className="absolute rounded-md overflow-hidden pointer-events-none"
                  style={{
                    width: THUMB_SIZE, height: THUMB_SIZE,
                    top: STACK_OFFSET, left: STACK_OFFSET,
                    transform: "rotate(6deg)",
                    border: "2px solid var(--bg-secondary)",
                    background: "var(--bg-tertiary)",
                  }}
                >
                  <Image src={log.imageUrls[1]} alt="" fill sizes="72px" className="object-cover" />
                </span>
              )}
              <span
                className="absolute rounded-md overflow-hidden"
                style={{
                  width: THUMB_SIZE, height: THUMB_SIZE,
                  top: 0, left: 0,
                  border: "2px solid var(--bg-secondary)",
                  background: "var(--bg-tertiary)",
                  // Lifts the front thumbnail off the one behind it, so the
                  // stack reads as multiple photos even when they look alike.
                  boxShadow: log.imageUrls.length > 1 ? "0 2px 8px rgba(0,0,0,0.6)" : "none",
                }}
              >
                <Image src={log.imageUrls[0]} alt="" fill sizes="72px" className="object-cover" />
              </span>
            </button>
          )}
        </div>
      </div>

      {detailOpen && (
        <PostLogDetailModal
          log={log}
          isOwner={isOwner}
          onClose={() => setDetailOpen(false)}
          onRequestEdit={() => { setDetailOpen(false); setEditing(true); }}
          onRequestDelete={() => { setDetailOpen(false); setConfirmOpen(true); }}
        />
      )}

      {/* Portaled for the same stacking-context reason as the modals below —
          hover:opacity-95 on this card would otherwise trap the lightbox. */}
      {lightboxIndex !== null && typeof document !== "undefined" && createPortal(
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />,
        document.body,
      )}

      {/* Portaled to <body> for the same stacking-context reason as the detail
          modal — hover:opacity-95 on this card would otherwise trap it. */}
      {confirmOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget && !deleting) setConfirmOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity disabled:pointer-events-none"
              aria-label={isJa ? "閉じる" : "Close"}
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <Trash2 size={22} style={{ color: "#f87171" }} />
              </div>
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {isJa ? "この制作ログを削除しますか？この操作は取り消せません。" : "Delete this build log? This action cannot be undone."}
              </p>
            </div>

            {deleteError && (
              <p className="flex items-center gap-2 text-xs justify-center" style={{ color: "#f87171" }}>
                <AlertCircle size={12} /> {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                {isJa ? "キャンセル" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {deleting ? (
                  <>{isJa ? "削除中..." : "Deleting..."}</>
                ) : (
                  <><Trash2 size={14} /> {isJa ? "削除する" : "Delete"}</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
