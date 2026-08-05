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

// Same sizes string for both variants — large/small only differ by ~15% in
// rendered width (1.15fr vs 1fr in the podium grid), so sharing one string
// avoids doubling the number of distinct (url, width) pairs next/image has
// to generate transformations for on top of the other places thumbnailUrl
// is already requested (PostCard, RankingCard, etc).
const IMAGE_SIZES = "(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 16vw";

export default function PodiumRankCard({ post, rank, score, size }: Props) {
  const style = RANK_STYLE[rank];
  const isLarge = size === "large";

  return (
    <Link
      href={`/posts/${post.id}`}
      className={`group relative block overflow-hidden ${isLarge ? "rounded-2xl" : "rounded-xl"}`}
      style={{ border: `${isLarge ? 2 : 1.5}px solid ${style.border}`, background: style.bg }}
    >
      {/* Image — both variants share the same 4:5 box and overlay the title
          on top of it (rather than stacking a separate block below), so
          total card height is always proportional to width alone. That's
          what keeps 1st (the wider grid column) reliably taller than
          2nd/3rd at every viewport size. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
        <Image
          src={post.thumbnailUrl}
          alt={post.title}
          fill
          sizes={IMAGE_SIZES}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,11,0.88) 0%, rgba(10,10,11,0.25) 45%, transparent 100%)" }}
        />

        {/* Rank + score badge — combined into one pill so it never collides
            with a separate score badge on narrow cards */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${isLarge ? "px-2.5 py-1 text-xs" : "px-2 py-1 text-[11px]"}`}
          style={{ background: style.bg, border: `1.5px solid ${style.border}`, color: style.text, backdropFilter: "blur(4px)" }}
        >
          <span className={isLarge ? "text-base leading-none" : "text-sm leading-none"}>{style.emoji}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{style.label}</span>
          <span className="opacity-50">·</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>♥{score}</span>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3
            className={`font-bold leading-tight mb-1.5 overflow-hidden ${isLarge ? "text-sm" : "text-xs"}`}
            style={{
              color: "var(--text-primary)",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {post.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className={`relative rounded-full overflow-hidden shrink-0 ${isLarge ? "w-5 h-5" : "w-4 h-4"}`}>
              <UserAvatar src={post.author.avatarUrl} alt={post.author.name} fill />
            </div>
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{post.author.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
