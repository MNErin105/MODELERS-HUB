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
  "Gunpla", "Aircraft", "Military", "Car", "Diorama", "Character Model", "Figure", "Other",
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
  username: string;
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
  /** post_images.id — the anchor for colour recipe tags. */
  postImageId?: string;
  /** How many colour recipe tags this image has; the tags themselves load on demand. */
  recipeTagCount?: number;
};

/**
 * An annotation on a post image: a pin on the photo, a line, and a box with a
 * colour swatch plus free text. Coordinates are fractions of the image (0-1),
 * so they survive the many sizes the same photo renders at.
 */
export type ColorRecipeTag = {
  id: string;
  postImageId: string;
  pin: { x: number; y: number };
  box: { x: number; y: number };
  colorHex: string;
  content: string;
  sortOrder: number;
};

/**
 * A colour recipe tag on a photo that hasn't been uploaded yet. `id` is a
 * client-side uuid used only to key the tag while the post form is open; the
 * real rows are inserted once the images have a post_images.id.
 */
export type DraftColorRecipeTag = {
  id: string;
  pin: { x: number; y: number };
  box: { x: number; y: number };
  colorHex: string;
  content: string;
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

export type PostLog = {
  id: string;
  content: string;
  genre: Category;
  /** Up to 2 images, in display order. */
  imageUrls: string[];
  linkedPost: { id: string; title: string; thumbnailUrl: string } | null;
  /** Position within its linked post's curated "Build Log" list, or null if not curated. */
  curationSortOrder: number | null;
  author: Author;
  likeCount: number;
  createdAt: string;
  updatedAt: string | null;
};

