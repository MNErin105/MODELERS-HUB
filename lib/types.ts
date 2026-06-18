export type Category =
  | "Gunpla"
  | "Military"
  | "Car"
  | "Character Model"
  | "Diorama";

export const CATEGORIES: Category[] = [
  "Gunpla", "Military", "Car", "Character Model", "Diorama",
];

export function categorySlug(c: Category): string {
  return c.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): Category | null {
  return CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}

// ─── Category metadata ────────────────────────────────────────────────────────
// subcategories: β版では Military に統合。将来 Tank / Aircraft / Ship 等へ細分化予定。

export type CategoryMeta = {
  icon: string;
  description: string;
  subcategories: string[];
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Gunpla": {
    icon: "🤖",
    description: "Bandai plastic model kits from the Gundam franchise.",
    subcategories: [],
  },
  "Military": {
    icon: "🪖",
    description: "All military scale models — tanks, aircraft, warships, submarines, military vehicles, and figures.",
    // β: unified. Future split → Tank | Aircraft | Ship | Submarine | Military Vehicle | Military Figure
    subcategories: ["Tank", "Aircraft", "Ship", "Submarine", "Military Vehicle", "Military Figure"],
  },
  "Car": {
    icon: "🚗",
    description: "Scale car models — racing, classic, and street builds.",
    subcategories: [],
  },
  "Character Model": {
    icon: "🎭",
    description: "Character and figure models — anime, sci-fi, and fantasy.",
    subcategories: [],
  },
  "Diorama": {
    icon: "🏔️",
    description: "Scene and diorama builds combining models, bases, and environmental storytelling.",
    subcategories: [],
  },
};

export type Author = {
  id: string;
  name: string;
  avatarUrl: string;
  country: string;
  bio: string;
  followersCount: number;
  followingCount: number;
};

// ─── Works photos ───────────────────────────────────────────────────────────

export type WorkPhoto = {
  url: string;
  caption: string;
};

// ─── Build Journal ───────────────────────────────────────────────────────────

export type BuildStepImage = {
  url: string;
  caption: string;
};

export type BuildStep = {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  images: BuildStepImage[];
  date: string;
  // Future: technique tags, material refs, linked tool IDs
};

// ─── Comments ────────────────────────────────────────────────────────────────

export type CommentReply = {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  author: Author;
  content: string;
  replies: CommentReply[];
  createdAt: string;
  // Future: upvoteCount, isHighlighted (AI-selected FAQ)
};

// ─── Post ─────────────────────────────────────────────────────────────────────

export type Post = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  images: WorkPhoto[];         // completed-work photos (Works tab gallery)
  author: Author;
  tags: string[];
  category: Category;
  kit: string;
  paints: string[];
  tools: string[];
  techniques: string[];
  saveCount: number;
  likeCount: number;
  weeklyLikeCount: number;
  createdAt: string;
};

export type Tag = {
  id: string;
  label: string;
  labelJa: string;
  count: number;
};
