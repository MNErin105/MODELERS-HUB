import { supabase } from "@/lib/supabase";

const MAX_PINS = 4;

export async function fetchPinnedPostIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("post_pins")
    .select("post_id")
    .eq("user_id", userId)
    .order("pinned_at", { ascending: true });
  return (data ?? []).map((r) => r.post_id as string);
}

// Returns an error string on failure, null on success
export async function addPin(userId: string, postId: string): Promise<string | null> {
  const ids = await fetchPinnedPostIds(userId);
  if (ids.includes(postId)) return null;
  if (ids.length >= MAX_PINS) {
    return `ピン留めは最大${MAX_PINS}件までです。`;
  }
  const { error } = await supabase
    .from("post_pins")
    .insert({ user_id: userId, post_id: postId });
  if (error) return error.message;
  return null;
}

export async function removePin(userId: string, postId: string): Promise<void> {
  await supabase
    .from("post_pins")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
}
