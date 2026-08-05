import { supabase } from "@/lib/supabase";
import { PostLog } from "@/lib/types";
import { StoredFile } from "@/lib/imageUtils";

// ── Raw row types ────────────────────────────────────────────────────────────

type RawProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
};

type RawImage = { image_url: string; sort_order: number };
type RawLinkedPost = { id: string; title: string; post_images: RawImage[] } | null;

type RawPostLog = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  profiles: RawProfile | RawProfile[] | null;
  post_log_images: RawImage[];
  post_log_likes: { user_id: string }[];
  posts: RawLinkedPost | RawLinkedPost[] | null;
};

function mapPostLog(raw: RawPostLog): PostLog {
  const profile = Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles;
  const linked   = Array.isArray(raw.posts) ? raw.posts[0] ?? null : raw.posts;

  const sortedImages = [...(raw.post_log_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const sortedLinkedImages = linked ? [...(linked.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : [];

  return {
    id:        raw.id,
    content:   raw.content,
    imageUrl:  sortedImages[0]?.image_url ?? null,
    linkedPost: linked
      ? { id: linked.id, title: linked.title, thumbnailUrl: sortedLinkedImages[0]?.image_url ?? "" }
      : null,
    author: {
      id:             profile?.id ?? "unknown",
      username:       profile?.username ?? "unknown",
      name:           profile?.display_name ?? "Unknown",
      avatarUrl:      profile?.avatar_url ?? "",
      country:        profile?.country ?? "",
      bio:            profile?.bio ?? "",
      followersCount: 0,
      followingCount: 0,
    },
    likeCount: (raw.post_log_likes ?? []).length,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

const POST_LOG_SELECT = [
  "id", "content", "created_at", "updated_at",
  "profiles!user_id (id, username, display_name, avatar_url, country, bio)",
  "post_log_images (image_url, sort_order)",
  "post_log_likes (user_id)",
  "posts!linked_post_id (id, title, post_images (image_url, sort_order))",
].join(", ");

// ── Queries ───────────────────────────────────────────────────────────────────

// Site-wide feed, newest first, real server-side pagination (post_logs can grow
// unboundedly, unlike the ~200-post pool the ranking sections slice client-side).
export async function getPostLogsFeed(
  page: number,
  pageSize: number,
): Promise<{ logs: PostLog[]; totalCount: number }> {
  const from = page * pageSize;
  const to   = from + pageSize - 1;

  const { data, count } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    logs:       (data ?? []).map((r) => mapPostLog(r as unknown as RawPostLog)),
    totalCount: count ?? 0,
  };
}

// One user's post logs, newest first. Not paginated — same convention as
// getPostsByUserId (profile tabs show the full list; volume is naturally
// bounded by the 3-per-week rate limit).
export async function getPostLogsByUserId(userId: string): Promise<PostLog[]> {
  const { data } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => mapPostLog(r as unknown as RawPostLog));
}

// Create a post log, optionally with one image and/or a linked post.
// Throws on failure — including the weekly-rate-limit trigger's exception,
// which the caller matches on message content to show a friendly error.
export async function createPostLog(
  userId: string,
  content: string,
  linkedPostId: string | null,
  image: { stored: StoredFile } | null,
): Promise<PostLog> {
  const { data: row, error } = await supabase
    .from("post_logs")
    .insert({ user_id: userId, content, linked_post_id: linkedPostId })
    .select("id")
    .single();

  if (error || !row) throw new Error(error?.message ?? "Failed to create post log");
  const postLogId = row.id as string;

  if (image) {
    const path = `${userId}/postlog-${postLogId}.${image.stored.ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, image.stored.buffer, { contentType: image.stored.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message ?? "Image upload failed");

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
    await supabase.from("post_log_images").insert({
      post_log_id: postLogId,
      image_url:   urlData.publicUrl,
      sort_order:  0,
    });
  }

  const { data: fullRow } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT)
    .eq("id", postLogId)
    .single();

  return mapPostLog(fullRow as unknown as RawPostLog);
}
