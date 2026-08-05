import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPostLogsFeed } from "@/lib/supabase/postLogsQueries";
import { POSTS_PAGE_SIZE } from "@/lib/constants";
import PostLogFeedClient from "@/components/post-logs/PostLogFeedClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Build Logs — Modelers Hub",
  description: "Quick updates from the community.",
};

export default async function PostLogsPage() {
  let logs: Awaited<ReturnType<typeof getPostLogsFeed>>["logs"] = [];
  let totalCount = 0;
  try {
    const result = await getPostLogsFeed(0, POSTS_PAGE_SIZE);
    logs = result.logs;
    totalCount = result.totalCount;
  } catch {
    // server fetch failed; client renders with empty list
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={16} /> Back
        </Link>

        <PostLogFeedClient initialLogs={logs} initialTotalCount={totalCount} />
      </div>
    </div>
  );
}
