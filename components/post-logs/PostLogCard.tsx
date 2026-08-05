import Link from "next/link";
import Image from "next/image";
import { PostLog } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import PostLogLikeButton from "./PostLogLikeButton";

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)          return `${Math.floor(diff)}s`;
  if (diff < 3600)        return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Props = { log: PostLog };

export default function PostLogCard({ log }: Props) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <Link href={`/profile/${log.author.username}`} className="shrink-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <UserAvatar src={log.author.avatarUrl} alt={log.author.name} fill />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/profile/${log.author.username}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {log.author.name}
          </Link>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            @{log.author.username} · {relativeTime(log.createdAt)}
          </span>
        </div>

        <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
          {log.content}
        </p>

        {log.imageUrl && (
          <div
            className="relative w-full rounded-lg overflow-hidden mt-3"
            style={{ aspectRatio: "4/3", maxHeight: 400, background: "var(--bg-tertiary)" }}
          >
            <Image
              src={log.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 500px"
              className="object-cover"
            />
          </div>
        )}

        {log.linkedPost && (
          <Link
            href={`/posts/${log.linkedPost.id}`}
            className="flex items-center gap-2 mt-3 p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
          >
            {log.linkedPost.thumbnailUrl && (
              <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                <Image src={log.linkedPost.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" />
              </div>
            )}
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              {log.linkedPost.title}
            </span>
          </Link>
        )}

        <div className="mt-2">
          <PostLogLikeButton postLogId={log.id} count={log.likeCount} />
        </div>
      </div>
    </div>
  );
}
