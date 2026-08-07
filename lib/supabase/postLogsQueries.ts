import { supabase } from "@/lib/supabase";
import { Category, PostLog } from "@/lib/types";
import { StoredFile } from "@/lib/imageUtils";
import { CATEGORY_TO_DB, DB_TO_CATEGORY } from "@/lib/supabase/queries";

// Extract the storage path segment from a Supabase public URL.
// URL shape: .../storage/v1/object/public/post-images/{path}
// Mirrors the identical helper in components/post/EditPostForm.tsx.
function storagePathFromUrl(url: string): string | null {
  const marker = "/post-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

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
  genre: string;
  created_at: string;
  updated_at: string | null;
  profiles: RawProfile | RawProfile[] | null;
  post_log_images: RawImage[];
  post_log_likes: { user_id: string }[];
  posts: RawLinkedPost | RawLinkedPost[] | null;
  post_log_curations: { sort_order: number }[];
};

function mapPostLog(raw: RawPostLog): PostLog {
  const profile = Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles;
  const linked   = Array.isArray(raw.posts) ? raw.posts[0] ?? null : raw.posts;

  const sortedImages = [...(raw.post_log_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const sortedLinkedImages = linked ? [...(linked.post_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : [];

  return {
    id:        raw.id,
    content:   raw.content,
    genre:     DB_TO_CATEGORY[raw.genre] ?? "Other",
    imageUrls: sortedImages.map((img) => img.image_url),
    linkedPost: linked
      ? { id: linked.id, title: linked.title, thumbnailUrl: sortedLinkedImages[0]?.image_url ?? "" }
      : null,
    curationSortOrder: raw.post_log_curations?.[0]?.sort_order ?? null,
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
  "id", "content", "genre", "created_at", "updated_at",
  "profiles!user_id (id, username, display_name, avatar_url, country, bio)",
  "post_log_images (image_url, sort_order)",
  "post_log_likes (user_id)",
  "posts!linked_post_id (id, title, post_images (image_url, sort_order))",
  "post_log_curations (sort_order)",
].join(", ");

// ── Queries ───────────────────────────────────────────────────────────────────

// Site-wide feed, newest first, real server-side pagination (post_logs can grow
// unboundedly, unlike the ~200-post pool the ranking sections slice client-side).
export async function getPostLogsFeed(
  page: number,
  pageSize: number,
  genre?: Category | null,
): Promise<{ logs: PostLog[]; totalCount: number }> {
  const from = page * pageSize;
  const to   = from + pageSize - 1;

  let query = supabase
    .from("post_logs")
    .select(POST_LOG_SELECT, { count: "exact" });

  if (genre) query = query.eq("genre", CATEGORY_TO_DB[genre] ?? "other");

  const { data, count } = await query
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

// Create a post log, optionally with up to 2 images and/or a linked post.
// Throws on failure — including the weekly-rate-limit trigger's exception,
// which the caller matches on message content to show a friendly error.
export async function createPostLog(
  userId: string,
  content: string,
  genre: Category,
  linkedPostId: string | null,
  images: { stored: StoredFile }[],
): Promise<PostLog> {
  const { data: row, error } = await supabase
    .from("post_logs")
    .insert({ user_id: userId, content, genre: CATEGORY_TO_DB[genre] ?? "other", linked_post_id: linkedPostId })
    .select("id")
    .single();

  if (error || !row) throw new Error(error?.message ?? "Failed to create post log");
  const postLogId = row.id as string;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const path = `${userId}/postlog-${postLogId}-${i}.${image.stored.ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, image.stored.buffer, { contentType: image.stored.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message ?? "Image upload failed");

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
    await supabase.from("post_log_images").insert({
      post_log_id: postLogId,
      image_url:   urlData.publicUrl,
      sort_order:  i,
    });
  }

  const { data: fullRow } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT)
    .eq("id", postLogId)
    .single();

  return mapPostLog(fullRow as unknown as RawPostLog);
}

// ── Curation ("まとめ") ─────────────────────────────────────────────────────
// A post owner hand-picks a subset of their own build logs already linked to
// that post (via linked_post_id) and orders them via post_log_curations.
// Linking a log to a post at posting time does NOT auto-curate it.

// Curated logs for a post's "Build Log" tab, in curator-defined order.
export async function getCuratedBuildLogs(postId: string): Promise<PostLog[]> {
  const { data } = await supabase
    .from("post_log_curations")
    .select(`sort_order, post_logs!inner (${POST_LOG_SELECT})`)
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  const rows = (data ?? []) as unknown as { post_logs: RawPostLog }[];
  return rows.map((r) => mapPostLog(r.post_logs));
}

// The post owner's own logs linked to this post but not yet curated —
// the "candidates" list in the curation editor.
export async function getCurationCandidates(userId: string, postId: string): Promise<PostLog[]> {
  const { data } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT)
    .eq("user_id", userId)
    .eq("linked_post_id", postId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((r) => mapPostLog(r as unknown as RawPostLog))
    .filter((log) => log.curationSortOrder === null);
}

export async function addToCuration(postId: string, postLogId: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from("post_log_curations")
    .insert({ post_id: postId, post_log_id: postLogId, sort_order: sortOrder });
  if (error) throw new Error(error.message);
}

export async function removeFromCuration(postId: string, postLogId: string): Promise<void> {
  const { error } = await supabase
    .from("post_log_curations")
    .delete()
    .eq("post_id", postId)
    .eq("post_log_id", postLogId);
  if (error) throw new Error(error.message);
}

// Persists a full reorder — orderedPostLogIds is the new curated list, in
// display order. Called after each drag-drop, same "parent owns the array,
// call back with the whole thing" pattern as ImagePreviewGrid's onReorder.
export async function reorderCuration(postId: string, orderedPostLogIds: string[]): Promise<void> {
  await Promise.all(
    orderedPostLogIds.map((postLogId, i) =>
      supabase
        .from("post_log_curations")
        .update({ sort_order: i })
        .eq("post_id", postId)
        .eq("post_log_id", postLogId),
    ),
  );
}

// ── Edit / delete ────────────────────────────────────────────────────────────

// Each entry is either an already-uploaded image being kept (by URL) or a
// newly picked file to upload. The array's order becomes the new sort_order.
export type PostLogImageInput =
  | { kind: "existing"; url: string }
  | { kind: "new"; stored: StoredFile };

// images:
//   "keep"                — leave the existing image set untouched
//   PostLogImageInput[]   — replace with this exact final set (0-2 entries)
export async function updatePostLog(
  userId: string,
  postLogId: string,
  content: string,
  genre: Category,
  linkedPostId: string | null,
  images: "keep" | PostLogImageInput[],
): Promise<PostLog> {
  const { data: before } = await supabase
    .from("post_logs")
    .select("linked_post_id")
    .eq("id", postLogId)
    .single();
  const previousLinkedPostId = (before?.linked_post_id as string | null) ?? null;

  const { error } = await supabase
    .from("post_logs")
    .update({ content, genre: CATEGORY_TO_DB[genre] ?? "other", linked_post_id: linkedPostId })
    .eq("id", postLogId);
  if (error) throw new Error(error.message ?? "Failed to update post log");

  // A curation row is only valid while the log is still linked to that post
  // (post_log_curations' insert policy enforces it, but existing rows aren't
  // re-checked). Re-pointing or clearing the link un-curates the log.
  if (previousLinkedPostId !== linkedPostId) {
    await supabase.from("post_log_curations").delete().eq("post_log_id", postLogId);
  }

  if (images !== "keep") {
    const { data: existingRows } = await supabase
      .from("post_log_images")
      .select("image_url")
      .eq("post_log_id", postLogId);

    // Only remove Storage objects for images that are actually dropped —
    // kept entries reuse their existing URL and must not be deleted.
    const keptUrls = new Set(
      images.filter((i): i is { kind: "existing"; url: string } => i.kind === "existing").map((i) => i.url),
    );
    const removedPaths = (existingRows ?? [])
      .map((r) => r.image_url as string)
      .filter((url) => !keptUrls.has(url))
      .map(storagePathFromUrl)
      .filter((p): p is string => !!p);
    if (removedPaths.length > 0) {
      await supabase.storage.from("post-images").remove(removedPaths);
    }

    await supabase.from("post_log_images").delete().eq("post_log_id", postLogId);

    const finalRows: { post_log_id: string; image_url: string; sort_order: number }[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.kind === "existing") {
        finalRows.push({ post_log_id: postLogId, image_url: img.url, sort_order: i });
        continue;
      }
      const path = `${userId}/postlog-${postLogId}-${Date.now()}-${i}.${img.stored.ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(path, img.stored.buffer, { contentType: img.stored.contentType, upsert: false });
      if (upErr) throw new Error(upErr.message ?? "Image upload failed");
      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
      finalRows.push({ post_log_id: postLogId, image_url: urlData.publicUrl, sort_order: i });
    }
    if (finalRows.length > 0) {
      await supabase.from("post_log_images").insert(finalRows);
    }
  }

  const { data: fullRow } = await supabase
    .from("post_logs")
    .select(POST_LOG_SELECT)
    .eq("id", postLogId)
    .single();

  return mapPostLog(fullRow as unknown as RawPostLog);
}

// Deletes a post log. post_log_images/likes/comments/curations all cascade
// via ON DELETE CASCADE, but the Storage objects themselves do not — clean
// them up explicitly first, same pattern as EditPostForm's post delete.
export async function deletePostLog(postLogId: string, imageUrls: string[]): Promise<void> {
  const paths = imageUrls.map(storagePathFromUrl).filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from("post-images").remove(paths);
  }
  const { error } = await supabase.from("post_logs").delete().eq("id", postLogId);
  if (error) throw new Error(error.message ?? "Failed to delete post log");
}
