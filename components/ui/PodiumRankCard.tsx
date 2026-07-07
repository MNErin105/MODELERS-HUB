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
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.3) 50%, transparent 100%)" }}
          />

          {/* Rank + score badge — combined into one pill (top-left) so the two
              never collide on narrow cards */}
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
            style={{ background: style.bg, border: `1.5px solid ${style.border}`, color: style.text, backdropFilter: "blur(4px)" }}
          >
            <span className="text-base leading-none">{style.emoji}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{style.label}</span>
            <span className="opacity-50">·</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>♥{score}</span>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3
              className="text-sm font-bold leading-tight mb-1.5 overflow-hidden"
              style={{ color: "var(--text-primary)", textShadow: "0 1px 4px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
            >
              {post.title}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                <UserAvatar src={post.author.avatarUrl} alt={post.author.name} fill />
              </div>
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{post.author.name}</span>
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
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 15vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,11,0.7) 0%, transparent 60%)" }}
        />

        {/* Rank + score badge — combined into one pill (top-left) so the two
            never collide on narrow cards */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap"
          style={{ background: style.bg, border: `1.5px solid ${style.border}`, color: style.text, backdropFilter: "blur(4px)" }}
        >
          <span className="text-sm leading-none">{style.emoji}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{style.label}</span>
          <span className="opacity-50">·</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>♥{score}</span>
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
