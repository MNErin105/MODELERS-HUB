// Supabase Edge Function — cleanup-chat-rooms
// Deletes chat rooms whose last message is more than 5 days old, along with
// their Storage files. Deleting the chat_rooms row cascades (ON DELETE
// CASCADE) to chat_room_members, chat_threads, chat_messages,
// chat_message_images, and chat_reactions automatically.
//
// Deploy:  supabase functions deploy cleanup-chat-rooms
// Schedule via Dashboard → Edge Functions → Add cron trigger: "0 * * * *" (hourly)
// Or invoke manually: supabase functions invoke cleanup-chat-rooms

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

Deno.serve(async () => {
  const cutoff = new Date(Date.now() - FIVE_DAYS_MS).toISOString();

  // 1. Find rooms that have gone quiet for 5+ days
  const { data: staleRooms, error: roomsErr } = await supabase
    .from("chat_rooms")
    .select("id")
    .lt("last_message_at", cutoff);

  if (roomsErr) {
    return new Response(JSON.stringify({ error: roomsErr.message }), { status: 500 });
  }

  if (!staleRooms || staleRooms.length === 0) {
    return new Response(JSON.stringify({ deletedRooms: 0, storageFiles: 0 }), { status: 200 });
  }

  const roomIds = staleRooms.map((r: { id: string }) => r.id);

  // 2. Collect image storage paths before the cascade delete removes the rows
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id")
    .in("room_id", roomIds);

  const messageIds = (messages ?? []).map((m: { id: string }) => m.id);

  let imageUrls: string[] = [];
  if (messageIds.length > 0) {
    const { data: imageRows } = await supabase
      .from("chat_message_images")
      .select("image_url")
      .in("message_id", messageIds);
    imageUrls = (imageRows ?? []).map((r: { image_url: string }) => r.image_url);
  }

  const marker = "/chat-images/";
  const storagePaths = imageUrls
    .map((url) => {
      const idx = url.indexOf(marker);
      return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
    })
    .filter((p): p is string => p !== null);

  if (storagePaths.length > 0) {
    await supabase.storage.from("chat-images").remove(storagePaths);
  }

  // 3. Delete the rooms — cascades to members/threads/messages/images/reactions
  const { error: delErr } = await supabase
    .from("chat_rooms")
    .delete()
    .in("id", roomIds);

  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ deletedRooms: roomIds.length, storageFiles: storagePaths.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
