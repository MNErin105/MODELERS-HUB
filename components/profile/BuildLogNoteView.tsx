"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { PostLog } from "@/lib/types";
import PostLogCard from "@/components/post-logs/PostLogCard";

type Props = {
  postLogs: PostLog[];
  onDeleted?: (logId: string) => void;
  onUpdated?: (log: PostLog) => void;
};

type Group = {
  post: { id: string; title: string; thumbnailUrl: string };
  logs: PostLog[];
};

function groupCuratedByPost(postLogs: PostLog[]): Group[] {
  const map = new Map<string, Group>();
  for (const log of postLogs) {
    if (log.curationSortOrder === null || !log.linkedPost) continue;
    const key = log.linkedPost.id;
    if (!map.has(key)) map.set(key, { post: log.linkedPost, logs: [] });
    map.get(key)!.logs.push(log);
  }
  for (const group of map.values()) {
    group.logs.sort((a, b) => (a.curationSortOrder ?? 0) - (b.curationSortOrder ?? 0));
  }
  return [...map.values()].sort((a, b) => {
    const aLatest = Math.max(...a.logs.map((l) => new Date(l.createdAt).getTime()));
    const bLatest = Math.max(...b.logs.map((l) => new Date(l.createdAt).getTime()));
    return bLatest - aLatest;
  });
}

// ── Portrait cover card ───────────────────────────────────────────────────

function CoverCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02]"
      style={{ aspectRatio: "3/4", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
    >
      {group.post.thumbnailUrl && (
        <Image
          src={group.post.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 767px) 50vw, 25vw"
          className="object-cover"
        />
      )}

      <span
        className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: "rgba(0,0,0,0.65)", color: "#fff", fontFamily: "var(--font-mono)" }}
      >
        {group.logs.length}
      </span>

      <div
        className="absolute inset-x-0 bottom-0 p-3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)" }}
      >
        <span className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#fff" }}>
          {group.post.title}
        </span>
      </div>
    </button>
  );
}

// ── Expanded note (modal) ─────────────────────────────────────────────────

type NoteModalProps = {
  group: Group;
  onClose: () => void;
  onDeleted?: (logId: string) => void;
  onUpdated?: (log: PostLog) => void;
};

function NoteModal({ group, onClose, onDeleted, onUpdated }: NoteModalProps) {
  const locale = useLocale();
  const isJa   = locale === "ja";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
          aria-label={isJa ? "閉じる" : "Close"}
        >
          <X size={14} />
        </button>

        <Link
          href={`/posts/${group.post.id}`}
          className="flex items-center gap-3 p-4 transition-opacity hover:opacity-80"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {group.post.thumbnailUrl && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <Image src={group.post.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
            </div>
          )}
          <span className="text-base font-bold leading-snug pr-8" style={{ color: "var(--text-primary)" }}>
            {group.post.title}
          </span>
        </Link>

        <div className="flex flex-col gap-3 p-4">
          {group.logs.map((log) => (
            <PostLogCard
              key={log.id}
              log={log}
              onDeleted={onDeleted ? () => onDeleted(log.id) : undefined}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── View ──────────────────────────────────────────────────────────────────

export default function BuildLogNoteView({ postLogs, onDeleted, onUpdated }: Props) {
  const t = useTranslations("profile.logView");
  const groups = useMemo(() => groupCuratedByPost(postLogs), [postLogs]);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const openGroup = groups.find((g) => g.post.id === openPostId) ?? null;

  if (groups.length === 0) {
    return (
      <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
        {t("empty")}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
        {groups.map((group) => (
          <CoverCard key={group.post.id} group={group} onOpen={() => setOpenPostId(group.post.id)} />
        ))}
      </div>

      {openGroup && (
        <NoteModal
          group={openGroup}
          onClose={() => setOpenPostId(null)}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
