export type Category =
  | "Gunpla"
  | "Military"
  | "Car"
  | "Character Model"
  | "Diorama"
  | "Aircraft"
  | "Ship"
  | "Figure"
  | "Other";

export const CATEGORIES: Category[] = [
  "Gunpla", "Military", "Car", "Character Model", "Diorama",
  "Aircraft", "Figure", "Other",
];

export function categorySlug(c: Category): string {
  return c.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): Category | null {
  return CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}

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
    description: "All military scale models — tanks, warships, submarines, military vehicles, and figures.",
    subcategories: ["Tank", "Submarine", "Military Vehicle", "Military Figure"],
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
  "Aircraft": {
    icon: "✈️",
    description: "Scale aircraft models — fighters, bombers, civilian planes, and helicopters.",
    subcategories: [],
  },
  "Ship": {
    icon: "🚢",
    description: "Scale warships and vessels — battleships, carriers, submarines, and sailboats.",
    subcategories: [],
  },
  "Figure": {
    icon: "🧍",
    description: "Standalone figures — resin kits, garage kits, and painted character figures.",
    subcategories: [],
  },
  "Other": {
    icon: "🔧",
    description: "Sci-fi, fantasy, and other builds that don't fit neatly elsewhere.",
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

export type WorkPhoto = {
  url: string;
  caption: string;
  /** Author's per-image comment — shown only in the fullscreen lightbox, not in feed. */
  authorComment?: string | null;
};

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
};

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
};

export type Post = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  images: WorkPhoto[];
  buildSteps?: BuildStep[];
  author: Author;
  tags: string[];
  categories: Category[];
  kit: string;
  paints: string[];
  tools: string[];
  techniques: string[];
  saveCount: number;
  likeCount: number;
  weeklyLikeCount: number;
  createdAt: string;
  allowSnsRepost: boolean;
};

export type Tag = {
  id: string;
  label: string;
  labelJa: string;
  count: number;
};

export type Story = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
};
