import { supabase } from "@/lib/supabase";

export async function getFeaturedPostId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("featured_post_id")
    .eq("id", userId)
    .single();
  return (data?.featured_post_id as string | null) ?? null;
}

export async function setFeaturedPost(userId: string, postId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ featured_post_id: postId })
    .eq("id", userId);
}

export async function clearFeaturedPost(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ featured_post_id: null })
    .eq("id", userId);
}
