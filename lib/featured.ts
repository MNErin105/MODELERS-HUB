import { supabase } from "@/lib/supabase";

export async function getFeaturedData(userId: string): Promise<{ postId: string | null; imageUrl: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("featured_post_id, featured_image_url")
    .eq("id", userId)
    .single();

  if (!error) {
    return {
      postId:   (data?.featured_post_id   as string | null) ?? null,
      imageUrl: (data?.featured_image_url as string | null) ?? null,
    };
  }

  // featured_image_url 列がまだ DB に存在しない場合は combined SELECT がエラーになる。
  // その場合は featured_post_id だけを取得してフォールバック。
  const { data: fallback } = await supabase
    .from("profiles")
    .select("featured_post_id")
    .eq("id", userId)
    .single();
  return {
    postId:   (fallback?.featured_post_id as string | null) ?? null,
    imageUrl: null,
  };
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

export async function uploadFeaturedImage(
  userId: string,
  buffer: ArrayBuffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const path = `${userId}/featured.${ext}`;
  const { error } = await supabase.storage
    .from("featured-images")
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("featured-images").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  await supabase
    .from("profiles")
    .update({ featured_image_url: url, featured_post_id: null })
    .eq("id", userId);
  return url;
}

export async function clearFeaturedImageUrl(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ featured_image_url: null })
    .eq("id", userId);
}
