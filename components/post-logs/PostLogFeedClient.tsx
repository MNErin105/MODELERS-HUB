"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Category, PostLog } from "@/lib/types";
import { POSTS_PAGE_SIZE } from "@/lib/constants";
import { getPostLogsFeed } from "@/lib/supabase/postLogsQueries";
import GenrePills from "@/components/ui/GenrePills";
import PostLogCard from "./PostLogCard";

type Props = {
  initialLogs: PostLog[];
  initialTotalCount: number;
};

export default function PostLogFeedClient({ initialLogs, initialTotalCount }: Props) {
  const [genre,      setGenre]      = useState<Category | null>(null);
  const [page,       setPage]       = useState(0);
  const [logs,       setLogs]       = useState(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading,    setLoading]    = useState(false);

  // Page 0 with no genre filter is already server-rendered via initialLogs —
  // only refetch when navigating away from that exact state.
  useEffect(() => {
    if (page === 0 && genre === null) { setLogs(initialLogs); setTotalCount(initialTotalCount); return; }
    let cancelled = false;
    setLoading(true);
    getPostLogsFeed(page, POSTS_PAGE_SIZE, genre).then(({ logs: fetched, totalCount: count }) => {
      if (cancelled) return;
      setLogs(fetched);
      setTotalCount(count);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, genre, initialLogs, initialTotalCount]);

  function handleGenreChange(cat: Category | null) {
    setGenre(cat);
    setPage(0);
  }

  function handleDeleted(logId: string) {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  }

  function handleUpdated(updated: PostLog) {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PAGE_SIZE));

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-8">
        <h1
          className="text-3xl font-bold tracking-widest"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Build Logs
        </h1>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {totalCount.toLocaleString()}
        </span>
      </div>

      <GenrePills active={genre} onChange={handleGenreChange} className="flex flex-wrap gap-2 mb-6" />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          No build logs yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span
            className="text-sm tabular-nums select-none"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: "4rem", textAlign: "center" }}
          >
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-70"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
