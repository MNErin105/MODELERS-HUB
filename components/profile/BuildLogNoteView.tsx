"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const t = useTranslations("profile.logView");
  const [open, setOpen] = useState(false);
  const preview = group.logs.slice(0, 1);
  const shown = open ? group.logs : preview;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <Link href={`/posts/${group.post.id}`} className="flex items-center gap-3 p-4 transition-opacity hover:opacity-80">
        {group.post.thumbnailUrl && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <Image src={group.post.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
        <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {group.post.title}
        </span>
      </Link>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {shown.map((log) => (
          <PostLogCard
            key={log.id}
            log={log}
            onDeleted={onDeleted ? () => onDeleted(log.id) : undefined}
            onUpdated={onUpdated}
          />
        ))}
      </div>

      {group.logs.length > 1 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 w-full px-4 py-3 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-primary)", borderTop: "1px solid var(--border-subtle)" }}
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {open ? t("collapse") : t("expand", { count: group.logs.length })}
        </button>
      )}
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

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {groups.map((group) => (
        <NoteCard key={group.post.id} group={group} onDeleted={onDeleted} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
