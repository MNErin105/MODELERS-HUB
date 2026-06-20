import Image from "next/image";
import Link from "next/link";
import { Post } from "@/lib/types";
import { RANK_STYLE } from "@/lib/ranking";
import UserAvatar from "@/components/ui/UserAvatar";

type Rank = 0 | 1 | 2; // 0-indexed for array access

type Props = {
  post: Post;
  rank: Rank;
  score: number;
  size: "large" | "small";
};

export default function PodiumRankCard({ post, rank, score, size }: Props) {
  const style = RANK_STYLE[rank];

  if (size === "large") {
    return (
      <Link
        href={`/posts/${post.id}`}
        className="group relative rounded-2xl overflow-hidden block"
        style={{ border: `2px solid ${style.border}`, background: style.bg }}
      >
        {/* Image */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.3) 50%, transparent 100%)" }}
          />

          {/* Medal badge — top-left */}
          <div
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
            style={{ background: style.bg, border: `1.5px solid ${style.border}`, color: style.text, backdropFilter: "blur(4px)" }}
          >
            <span className="text-xl leading-none">{style.emoji}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{style.label}</span>
          </div>

          {/* Score badge — top-right */}
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: "rgba(10,10,11,0.7)", color: style.text, fontFamily: "var(--font-mono)", backdropFilter: "blur(4px)" }}
          >
            ♥ {score} <span className="text-xs font-normal opacity-70">/ week</span>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3
              className="text-xl font-bold leading-tight mb-2"
              style={{ color: "var(--text-primary)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {post.title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                <UserAvatar src={post.author.avatarUrl} alt={post.author.name} fill />
              </div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{post.author.name}</span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: "rgba(10,10,11,0.6)", color: "var(--text-muted)" }}
              >
                {post.author.country}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ── Small card (2nd / 3rd) ─────────────────────────────────────────────
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group relative rounded-xl overflow-hidden flex flex-col h-full"
      style={{ border: `1.5px solid ${style.border}`, background: style.bg }}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,11,0.7) 0%, transparent 60%)" }}
        />

        {/* Medal badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold"
          style={{ background: style.bg, border: `1.5px solid ${style.border}`, color: style.text, backdropFilter: "blur(4px)" }}
        >
          <span className="text-base leading-none">{style.emoji}</span>
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)" }}>{style.label}</span>
        </div>

        {/* Score */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "rgba(10,10,11,0.7)", color: style.text, fontFamily: "var(--font-mono)" }}
        >
          ♥ {score}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <h3
          className="text-sm font-bold leading-snug overflow-hidden"
          style={{ color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-auto">
          <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
            <UserAvatar src={post.author.avatarUrl} alt={post.author.name} fill />
          </div>
          <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
            {post.author.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
