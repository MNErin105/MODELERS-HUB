import { supabase } from "@/lib/supabase";

export async function getFeaturedData(userId: string): Promise<{ postId: string | null; imageUrl: string | null } | null> {
  // NOTE: Supabase queries can hang indefinitely. Always wrap with Promise.race +
  // timeout and catch — same pattern as AuthContext / DynamicProfilePage.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("getFeaturedData timeout")), 5000)
  );
  try {
    const { data, error } = await Promise.race([
      supabase
        .from("profiles")
        .select("featured_post_id, featured_image_url")
        .eq("id", userId)
        .single(),
      timeout,
    ]);

    if (!error) {
      return {
        postId:   (data?.featured_post_id   as string | null) ?? null,
        imageUrl: (data?.featured_image_url as string | null) ?? null,
      };
    }

    // featured_image_url 列がまだ DB に存在しない場合は combined SELECT がエラーになる。
    // その場合は featured_post_id だけを取得してフォールバック。
    const fallbackTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("getFeaturedData fallback timeout")), 5000)
    );
    const { data: fallback } = await Promise.race([
      supabase
        .from("profiles")
        .select("featured_post_id")
        .eq("id", userId)
        .single(),
      fallbackTimeout,
    ]);
    return {
      postId:   (fallback?.featured_post_id as string | null) ?? null,
      imageUrl: null,
    };
  } catch (err) {
    console.error("[getFeaturedData] query failed or timed out:", err);
    return null; // null = failure (caller must not overwrite existing state)
  }
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
  const url = data.publicUrl;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  console.log("[uploadFeaturedImage] auth user:", authData?.user?.id, authError);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ featured_image_url: url, featured_post_id: null })
    .eq("id", userId);
  if (updateError) console.error("[uploadFeaturedImage] profiles update error:", updateError);

  return url;
}

export async function clearFeaturedImageUrl(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ featured_image_url: null })
    .eq("id", userId);
}
