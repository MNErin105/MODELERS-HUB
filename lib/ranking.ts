import { Post, Category } from "./types";

// ─── Ranking dimensions ────────────────────────────────────────────────────
// Extend these union types when new ranking types are added.

export type RankingPeriod =
  | "weekly"
  | "monthly"   // TODO: add monthlyLikeCount field to Post
  | "yearly";   // TODO: add yearlyLikeCount field to Post

export type RankingMetric =
  | "likes"
  | "saves"
  | "views";    // TODO: add viewCount field to Post
  // Future: | "new-builder-likes" | "country-likes"

export type RankingScope =
  | { type: "category"; category: Category }
  | { type: "global" }
  | { type: "country"; country: string };  // Future

export type RankingConfig = {
  period: RankingPeriod;
  metric: RankingMetric;
  scope: RankingScope;
  limit?: number;
};

// ─── Scoring ──────────────────────────────────────────────────────────────

export function scorePost(post: Post, config: Pick<RankingConfig, "period" | "metric">): number {
  if (config.metric === "likes") {
    if (config.period === "weekly") return post.weeklyLikeCount;
    // When monthly/yearly fields are added, switch here:
    // if (config.period === "monthly") return post.monthlyLikeCount;
    return post.likeCount;
  }
  if (config.metric === "saves") return post.saveCount;
  // if (config.metric === "views") return post.viewCount ?? 0;
  return 0;
}

// ─── Query ────────────────────────────────────────────────────────────────

export function getRankedPosts(posts: Post[], config: RankingConfig): Post[] {
  let filtered: Post[];

  const scope = config.scope;
  if (scope.type === "category") {
    filtered = posts.filter((p) => p.categories.includes(scope.category));
  } else if (scope.type === "country") {
    filtered = posts.filter((p) => p.author.country === scope.country);
  } else {
    filtered = [...posts];
  }

  return filtered
    .sort((a, b) => scorePost(b, config) - scorePost(a, config))
    .slice(0, config.limit ?? 3);
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export const PERIOD_LABELS: Record<RankingPeriod, string> = {
  weekly:  "Weekly",
  monthly: "Monthly",
  yearly:  "Yearly",
};

export const METRIC_LABELS: Record<RankingMetric, string> = {
  likes: "Likes",
  saves: "Saves",
  views: "Views",
};

export const MEDAL_EMOJI = ["🥇", "🥈", "🥉"] as const;
export const MEDAL_LABELS = ["1st", "2nd", "3rd"] as const;

export const RANK_STYLE = [
  { border: "#c8a96e", bg: "rgba(200,169,110,0.08)", text: "#c8a96e", label: "1st", emoji: "🥇" },
  { border: "#9e9e9e", bg: "rgba(158,158,158,0.06)", text: "#9e9e9e", label: "2nd", emoji: "🥈" },
  { border: "#cd7f32", bg: "rgba(205,127,50,0.06)",  text: "#cd7f32", label: "3rd", emoji: "🥉" },
] as const;
