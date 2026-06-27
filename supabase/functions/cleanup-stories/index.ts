// Supabase Edge Function — cleanup-stories
// Deletes expired story rows from the DB and their files from Storage.
//
// Deploy:  supabase functions deploy cleanup-stories
// Schedule via Dashboard → Edge Functions → Add cron trigger: "0 * * * *" (hourly)
// Or invoke manually: supabase functions invoke cleanup-stories

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  // 1. Fetch expired story rows (image_url needed to extract storage paths)
  const { data: expired, error: fetchErr } = await supabase
    .from("stories")
    .select("id, image_url")
    .lt("expires_at", new Date().toISOString());

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ deleted: 0 }), { status: 200 });
  }

  // 2. Extract storage paths from public URLs and remove files
  const marker = "/stories/";
  const storagePaths: string[] = expired
    .map((s: { image_url: string }) => {
      const idx = s.image_url.indexOf(marker);
      return idx !== -1 ? decodeURIComponent(s.image_url.slice(idx + marker.length)) : null;
    })
    .filter((p): p is string => p !== null);

  if (storagePaths.length > 0) {
    await supabase.storage.from("stories").remove(storagePaths);
  }

  // 3. Delete DB rows
  const ids = expired.map((s: { id: string }) => s.id);
  const { error: delErr } = await supabase
    .from("stories")
    .delete()
    .in("id", ids);

  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ deleted: ids.length, storageFiles: storagePaths.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
