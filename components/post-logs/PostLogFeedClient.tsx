"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PostLog } from "@/lib/types";
import { POSTS_PAGE_SIZE } from "@/lib/constants";
import { getPostLogsFeed } from "@/lib/supabase/postLogsQueries";
import PostLogCard from "./PostLogCard";

type Props = {
  initialLogs: PostLog[];
  initialTotalCount: number;
};

export default function PostLogFeedClient({ initialLogs, initialTotalCount }: Props) {
  const [page,       setPage]       = useState(0);
  const [logs,       setLogs]       = useState(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading,    setLoading]    = useState(false);

  // Page 0 is already server-rendered via initialLogs — only refetch when
  // navigating away from it.
  useEffect(() => {
    if (page === 0) { setLogs(initialLogs); setTotalCount(initialTotalCount); return; }
    let cancelled = false;
    setLoading(true);
    getPostLogsFeed(page, POSTS_PAGE_SIZE).then(({ logs: fetched, totalCount: count }) => {
      if (cancelled) return;
      setLogs(fetched);
      setTotalCount(count);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page, initialLogs, initialTotalCount]);

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PAGE_SIZE));

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          No post logs yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => <PostLogCard key={log.id} log={log} />)}
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
