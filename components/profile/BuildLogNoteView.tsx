"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
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

type NoteCardProps = {
  group: Group;
  onDeleted?: (logId: string) => void;
  onUpdated?: (log: PostLog) => void;
};

function NoteCard({ group, onDeleted, onUpdated }: NoteCardProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      {/* Cover */}
      <Link
        href={`/posts/${group.post.id}`}
        className="flex flex-col items-center gap-2 p-4 text-center transition-opacity hover:opacity-80"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {group.post.thumbnailUrl && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <Image src={group.post.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
        <span className="text-base font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
          {group.post.title}
        </span>
      </Link>

      <div className="flex flex-col gap-3 p-3">
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
  );
}

export default function BuildLogNoteView({ postLogs, onDeleted, onUpdated }: Props) {
  const t = useTranslations("profile.logView");
  const groups = useMemo(() => groupCuratedByPost(postLogs), [postLogs]);

  if (groups.length === 0) {
    return (
      <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
        {t("empty")}
      </p>
    );
  }

  // items-start keeps each card at its natural height instead of stretching
  // to the tallest in the row — note cards vary a lot once every log is shown.
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
      {groups.map((group) => (
        <NoteCard key={group.post.id} group={group} onDeleted={onDeleted} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
