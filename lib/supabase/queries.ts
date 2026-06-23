import { supabase } from "@/lib/supabase";
import type { Post, Author, WorkPhoto, BuildStep, Comment, Category } from "@/lib/types";

// ── Category mapping ──────────────────────────────────────────────────────────

export const CATEGORY_TO_DB: Record<string, string> = {
  Gunpla:             "gunpla",
  Military:           "military",
  Car:                "car_model",
  "Character Model":  "character_model",
  Diorama:            "diorama",
  Figure:             "figure",
  Other:              "other",
};

const DB_TO_CATEGORY: Record<string, Category> = {
  gunpla:           "Gunpla",
  military:         "Military",
  car_model:        "Car",
  character_model:  "Character Model",
  diorama:          "Diorama",
  figure:           "Figure",
  other:            "Other",
};

// ── Raw Supabase row types ────────────────────────────────────────────────────

type RawLike      = { user_id: string; created_at: string };
type RawBookmark  = { user_id: string };
type RawImage     = { image_url: string; caption: string | null; author_comment: string | null; sort_order: number };
type RawTag       = { tags: { name: string } | null };
type RawPaint     = { paint_name: string };
type RawProfile   = { id: string; username: string; display_name: string; avatar_url: string | null; country: string | null; bio: string | null };

type RawPost = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  kit_name: string | null;
  created_at: string;
  profiles: RawProfile | null;
  post_images: RawImage[];
  post_tags: RawTag[];
  post_paints: RawPaint[];
  likes: RawLike[];
  bookmarks: RawBookmark[];
};

// ── Transformation ────────────────────────────────────────────────────────────

function rawToPost(raw: RawPost): Post {
  const sortedImages = [...raw.post_images].sort((a, b) => a.sort_order - b.sort_order);

  const author: Author = raw.profiles
    ? {
        id:             raw.profiles.id,
        name:           raw.profiles.display_name,
        avatarUrl:      raw.profiles.avatar_url ?? "",
        country:        raw.profiles.country ?? "",
        bio:            raw.profiles.bio ?? "",
        followersCount: 0,
        followingCount: 0,
      }
    : { id: "unknown", name: "Unknown", avatarUrl: "", country: "", bio: "", followersCount: 0, followingCount: 0 };

  const images: WorkPhoto[] = sortedImages.map((img) => ({
    url:           img.image_url,
    caption:       img.caption ?? "",
    authorComment: img.author_comment ?? null,
  }));

  const tags = raw.post_tags
    .map((pt) => pt.tags?.name)
    .filter((n): n is string => !!n);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id:              raw.id,
    title:           raw.title,
    description:     raw.description ?? "",
    thumbnailUrl:    sortedImages[0]?.image_url ?? "",
    images,
    author,
    tags,
    category:        DB_TO_CATEGORY[raw.category] ?? "Other",
    kit:             raw.kit_name ?? "",
    paints:          raw.post_paints.map((p) => p.paint_name),
    tools:           [],
    techniques:      [],
    saveCount:       raw.bookmarks.length,
    likeCount:       raw.likes.length,
    weeklyLikeCount: raw.likes.filter((l) => l.created_at >= weekAgo).length,
    createdAt:       raw.created_at,
  };
}

// ── Select fragment ───────────────────────────────────────────────────────────

const POST_SELECT = [
  "id", "title", "description", "category", "kit_name", "created_at",
  "profiles!user_id (id, username, display_name, avatar_url, country, bio)",
  "post_images (image_url, caption, author_comment, sort_order)",
  "post_tags (tags (name))",
  "post_paints (paint_name)",
  "likes (user_id, created_at)",
  "bookmarks (user_id)",
].join(", ");

// ── Post queries ──────────────────────────────────────────────────────────────

export async function getRecentPosts(limit = 20): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => rawToPost(r as unknown as RawPost));
}

export async function getPopularPosts(limit = 8): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .limit(200);
  return (data ?? [])
    .map((r) => rawToPost(r as unknown as RawPost))
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, limit);
}

export async function getPostsForHome(limit = 200): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => rawToPost(r as unknown as RawPost));
}

export async function getPostById(id: string): Promise<{ post: Post | null; buildSteps: BuildStep[] }> {
  const { data: postData } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .single();

  if (!postData) return { post: null, buildSteps: [] };

  const { data: journalData } = await supabase
    .from("build_journal_entries")
    .select("id, title, content, image_url, sort_order, created_at")
    .eq("post_id", id)
    .order("sort_order", { ascending: true });

  const buildSteps: BuildStep[] = (journalData ?? []).map((entry, i) => ({
    id:          entry.id as string,
    stepNumber:  i + 1,
    title:       (entry.title as string | null) ?? "",
    description: (entry.content as string | null) ?? "",
    date:        (entry.created_at as string).split("T")[0],
    images:      entry.image_url ? [{ url: entry.image_url as string, caption: "" }] : [],
  }));

  return { post: rawToPost(postData as unknown as RawPost), buildSteps };
}

export async function getPostsByUserId(userId: string, limit = 50): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => rawToPost(r as unknown as RawPost));
}

// ── Profile queries ───────────────────────────────────────────────────────────

export async function getPostsByIds(ids: string[]): Promise<Post[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids);
  return (data ?? []).map((r) => rawToPost(r as unknown as RawPost));
}

export async function getProfileById(id: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, country")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function getFollowersCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

// ── Quick-search types & queries ─────────────────────────────────────────────

export type QuickUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  country: string;
};

export type QuickPost = {
  id: string;
  title: string;
  kit: string;
  category: Category;
  thumbnailUrl: string;
};

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function searchProfiles(query: string, limit = 5): Promise<QuickUser[]> {
  const q = escapeIlike(query.trim());
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, country")
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(limit);
  return (data ?? []).map((p) => ({
    id:        p.id as string,
    username:  p.username as string,
    name:      (p.display_name as string | null) ?? (p.username as string),
    avatarUrl: (p.avatar_url  as string | null) ?? "",
    country:   (p.country     as string | null) ?? "",
  }));
}

export async function searchPostsQuick(query: string, limit = 3): Promise<QuickPost[]> {
  const q = escapeIlike(query.trim());
  const { data } = await supabase
    .from("posts")
    .select("id, title, kit_name, category, post_images(image_url, sort_order)")
    .or(`title.ilike.%${q}%,kit_name.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((p) => {
    const imgs = ((p.post_images as { image_url: string; sort_order: number }[]) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order);
    return {
      id:           p.id as string,
      title:        p.title as string,
      kit:          (p.kit_name as string | null) ?? "",
      category:     DB_TO_CATEGORY[p.category as string] ?? "Other",
      thumbnailUrl: imgs[0]?.image_url ?? "",
    };
  });
}

// ── Comment queries ───────────────────────────────────────────────────────────

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select(`
      id, content, created_at,
      profiles!user_id (id, display_name, avatar_url, country)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const p = (row as Record<string, unknown>).profiles as RawProfile | null;
    return {
      id:        row.id as string,
      content:   row.content as string,
      replies:   [],
      createdAt: row.created_at as string,
      author: {
        id:             p?.id ?? "unknown",
        name:           p?.display_name ?? "Anonymous",
        avatarUrl:      p?.avatar_url ?? "",
        country:        p?.country ?? "",
        bio:            "",
        followersCount: 0,
        followingCount: 0,
      },
    };
  });
}
