"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Check, Loader2 } from "lucide-react";
import { Post, PostLog } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { getCuratedBuildLogs } from "@/lib/supabase/postLogsQueries";
import PostLogCard from "@/components/post-logs/PostLogCard";
import BuildLogCurationEditor from "./BuildLogCurationEditor";

type Props = { post: Post };

export default function BuildLogTab({ post }: Props) {
  const t = useTranslations("post.buildLog");
  const { user } = useAuth();
  const [logs,    setLogs]    = useState<PostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const isOwner = user?.id === post.author.id;

  useEffect(() => {
    let cancelled = false;
    getCuratedBuildLogs(post.id).then((fetched) => {
      if (cancelled) return;
      setLogs(fetched);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [post.id]);

  function handleDeleted(logId: string) {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  function handleUpdated(updated: PostLog) {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div className="max-w-2xl">
      {isOwner && (
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {editing ? <Check size={13} /> : <Pencil size={13} />}
            {editing ? t("done") : t("edit")}
          </button>
        </div>
      )}

      {editing ? (
        <BuildLogCurationEditor postId={post.id} curated={logs} onCuratedChange={setLogs} />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <PostLogCard
              key={log.id}
              log={log}
              onDeleted={() => handleDeleted(log.id)}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
