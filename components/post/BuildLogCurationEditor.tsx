"use client";

import { useEffect, useState, DragEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { GripVertical, Plus, X, Loader2 } from "lucide-react";
import { PostLog } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getCurationCandidates,
  addToCuration,
  removeFromCuration,
  reorderCuration,
} from "@/lib/supabase/postLogsQueries";

type Props = {
  postId: string;
  curated: PostLog[];
  onCuratedChange: (logs: PostLog[]) => void;
};

export default function BuildLogCurationEditor({ postId, curated, onCuratedChange }: Props) {
  const t = useTranslations("post.buildLog");
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<PostLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx,  setOverIdx]  = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCurationCandidates(user.id, postId).then((logs) => {
      if (cancelled) return;
      setCandidates(logs);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, postId]);

  async function handleAdd(log: PostLog) {
    const prevCandidates = candidates;
    const prevCurated    = curated;
    setCandidates((prev) => prev.filter((l) => l.id !== log.id));
    onCuratedChange([...curated, log]);
    try {
      await addToCuration(postId, log.id, curated.length);
    } catch {
      setCandidates(prevCandidates);
      onCuratedChange(prevCurated);
    }
  }

  async function handleRemove(log: PostLog) {
    const prevCandidates = candidates;
    const prevCurated    = curated;
    onCuratedChange(curated.filter((l) => l.id !== log.id));
    setCandidates((prev) => [log, ...prev]);
    try {
      await removeFromCuration(postId, log.id);
    } catch {
      onCuratedChange(prevCurated);
      setCandidates(prevCandidates);
    }
  }

  function onDragStart(e: DragEvent, i: number) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    setOverIdx(i);
  }

  function onDrop(e: DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { reset(); return; }
    const next = [...curated];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    onCuratedChange(next);
    reorderCuration(postId, next.map((l) => l.id)).catch(() => {});
    reset();
  }

  function reset() { setDragIdx(null); setOverIdx(null); }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Curated (reorderable) ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {t("curatedTitle")}
        </span>
        {curated.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noCurated")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {curated.map((log, i) => (
              <div
                key={log.id}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragOver={(e)  => onDragOver(e, i)}
                onDrop={(e)      => onDrop(e, i)}
                onDragEnd={reset}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: "var(--bg-secondary)",
                  border:     "1px solid var(--border-subtle)",
                  opacity:    dragIdx === i ? 0.4 : 1,
                  outline:    overIdx === i && dragIdx !== i ? "2px solid var(--accent-primary)" : "none",
                  outlineOffset: "2px",
                  transition: "opacity 0.15s, outline 0.1s",
                }}
              >
                <GripVertical size={16} className="cursor-grab shrink-0" style={{ color: "var(--text-muted)" }} />
                {log.imageUrls[0] && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image src={log.imageUrls[0]} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                )}
                <p className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {log.content}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(log)}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  aria-label={t("remove")}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Candidates ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {t("candidatesTitle")}
        </span>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noCandidates")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border-muted)" }}
              >
                {log.imageUrls[0] && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image src={log.imageUrls[0]} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                )}
                <p className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {log.content}
                </p>
                <button
                  type="button"
                  onClick={() => handleAdd(log)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                >
                  <Plus size={12} /> {t("add")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
