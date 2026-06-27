import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import { StoredFile } from "@/lib/imageUtils";

// ── Raw row type ──────────────────────────────────────────────────────────────

type RawProfile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

type RawStory = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  // PostgREST returns a single object for many-to-one FK joins,
  // but guard against an array in case the relationship is inferred differently.
  profiles: RawProfile | RawProfile[] | null;
};

function mapStory(raw: RawStory): Story {
  // Normalise: PostgREST should return an object (many-to-one), but handle array defensively.
  const profile = Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles;
  return {
    id:        raw.id,
    userId:    raw.user_id,
    imageUrl:  raw.image_url,
    caption:   raw.caption,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
    author: {
      id:        profile?.id        ?? raw.user_id,
      name:      profile?.display_name ?? "Unknown",
      username:  profile?.username  ?? "",
      avatarUrl: profile?.avatar_url ?? null,
    },
  };
}

const STORY_SELECT = [
  "id", "user_id", "image_url", "caption", "created_at", "expires_at",
  "profiles!user_id (id, display_name, username, avatar_url)",
].join(", ");

// ── Queries ───────────────────────────────────────────────────────────────────

// Returns all active (non-expired) stories for ALL users, newest first.
// Design: no follow-filter — all users' stories are shown (suits a small community / testing).
// RLS "stories: public read (active only)" enforces expires_at > now() server-side.
export async function getActiveStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getActiveStories] query error:", error.message, error);
    return [];
  }

  console.log(`[getActiveStories] fetched ${data?.length ?? 0} stories`);
  return (data ?? []).map((r) => mapStory(r as unknown as RawStory));
}

// Upload image to stories bucket, insert DB row, return the new Story.
export async function createStory(
  userId: string,
  stored: StoredFile,
  caption: string | null,
): Promise<Story> {
  // 1. Upload image
  const path = `${userId}/${Date.now()}.${stored.ext}`;
  const { error: upErr } = await supabase.storage
    .from("stories")
    .upload(path, stored.buffer, { contentType: stored.contentType, upsert: false });
  if (upErr) throw new Error(upErr.message ?? "Story image upload failed");

  const { data: urlData } = supabase.storage.from("stories").getPublicUrl(path);

  // 2. Insert row
  const { data, error } = await supabase
    .from("stories")
    .insert({ user_id: userId, image_url: urlData.publicUrl, caption: caption || null })
    .select(STORY_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create story");

  return mapStory(data as unknown as RawStory);
}

// Delete a story (DB row + Storage file).
export async function deleteStory(story: Story): Promise<void> {
  // Best-effort Storage cleanup
  const marker = "/stories/";
  const idx = story.imageUrl.indexOf(marker);
  if (idx !== -1) {
    const storagePath = decodeURIComponent(story.imageUrl.slice(idx + marker.length));
    await supabase.storage.from("stories").remove([storagePath]);
  }
  await supabase.from("stories").delete().eq("id", story.id);
}
