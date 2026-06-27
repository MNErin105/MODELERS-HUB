import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import { StoredFile } from "@/lib/imageUtils";

// ── Raw row type ──────────────────────────────────────────────────────────────

type RawStory = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  profiles: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

function mapStory(raw: RawStory): Story {
  return {
    id:        raw.id,
    userId:    raw.user_id,
    imageUrl:  raw.image_url,
    caption:   raw.caption,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
    author: {
      id:        raw.profiles?.id        ?? raw.user_id,
      name:      raw.profiles?.display_name ?? "Unknown",
      username:  raw.profiles?.username  ?? "",
      avatarUrl: raw.profiles?.avatar_url ?? null,
    },
  };
}

const STORY_SELECT = [
  "id", "user_id", "image_url", "caption", "created_at", "expires_at",
  "profiles!user_id (id, display_name, username, avatar_url)",
].join(", ");

// ── Queries ───────────────────────────────────────────────────────────────────

// Returns all active (non-expired) stories, newest first.
// RLS on the stories table already filters out expired rows.
export async function getActiveStories(): Promise<Story[]> {
  const { data } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .order("created_at", { ascending: false });
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
