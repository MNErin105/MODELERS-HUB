import Image from "next/image";
import Link from "next/link";
import { Post } from "@/lib/types";
import { RANK_STYLE } from "@/lib/ranking";

type Props = {
  post: Post;
  rank: number;
  score?: number; // if omitted, falls back to post.weeklyLikeCount
};

export default function RankingCard({ post, rank, score }: Props) {
  const idx = rank - 1;
  const style = idx < 3 ? RANK_STYLE[idx as 0 | 1 | 2] : null;
  const displayScore = score ?? post.weeklyLikeCount;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex items-center gap-4 p-3 group transition-colors"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Rank */}
      <div className="shrink-0 w-9 text-center">
        {style ? (
          <span className="text-2xl leading-none">{style.emoji}</span>
        ) : (
          <span className="text-sm font-bold" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            #{rank}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div
        className="relative shrink-0 rounded-lg overflow-hidden"
        style={{ width: 72, height: 54, border: style ? `1.5px solid ${style.border}` : "1px solid var(--border-subtle)" }}
      >
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          loading="lazy"
          sizes="72px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {post.title}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {post.author.name}
        </p>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold" style={{ color: style ? style.text : "var(--color-like)" }}>
          ♥ {displayScore}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          this week
        </p>
      </div>
    </Link>
  );
}
