-- =============================================================================
--  MODELERS HUB — Chat feature (Workbench-style open chat rooms)
--
--  Design notes:
--  - chat_threads is a purely internal bookkeeping table. Users never see it
--    or interact with it directly — it exists so a room's message log can be
--    split into segments of up to 300 messages ("archived" once full) without
--    the app ever having to know or care. chat_messages carries both room_id
--    (what the app queries against) and thread_id (resolved automatically by
--    a trigger), so the client only ever needs to know the room.
--  - Room deletion is never exposed to users (not even the owner) — rooms
--    only disappear via the cleanup-chat-rooms Edge Function, which deletes
--    any room whose last_message_at is more than 5 days old. Deleting the
--    chat_rooms row cascades to members/threads/messages/images/reactions.
--  - RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
-- =============================================================================


-- =============================================================================
--  TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- chat_rooms
-- ---------------------------------------------------------------------------
create table public.chat_rooms (
  id               uuid        primary key default gen_random_uuid(),
  owner_id         uuid        not null references public.profiles(id) on delete cascade,
  name             text        not null,
  description      text,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index chat_rooms_owner_id_idx        on public.chat_rooms(owner_id);
create index chat_rooms_last_message_at_idx on public.chat_rooms(last_message_at);


-- ---------------------------------------------------------------------------
-- chat_room_members
-- ---------------------------------------------------------------------------
create table public.chat_room_members (
  id        uuid        primary key default gen_random_uuid(),
  room_id   uuid        not null references public.chat_rooms(id) on delete cascade,
  user_id   uuid        not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),

  unique (room_id, user_id)
);

create index chat_room_members_user_id_idx on public.chat_room_members(user_id);


-- ---------------------------------------------------------------------------
-- chat_threads
--   Internal-only. Never inserted/updated directly by client code — see
--   chat_get_active_thread() / chat_messages_assign_thread() below.
-- ---------------------------------------------------------------------------
create table public.chat_threads (
  id             uuid        primary key default gen_random_uuid(),
  room_id        uuid        not null references public.chat_rooms(id) on delete cascade,
  message_count  int         not null default 0,
  is_archived    boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index chat_threads_room_id_idx on public.chat_threads(room_id);

-- At most one active (non-archived) thread per room at any time — the
-- get-or-create resolver below relies on this to find "the" active thread.
create unique index chat_threads_one_active_per_room
  on public.chat_threads(room_id)
  where is_archived = false;


-- ---------------------------------------------------------------------------
-- chat_messages
--   Client supplies room_id; thread_id is resolved automatically (trigger).
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  room_id    uuid        not null references public.chat_rooms(id)   on delete cascade,
  thread_id  uuid        not null references public.chat_threads(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null check (char_length(content) <= 140),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index chat_messages_room_id_idx   on public.chat_messages(room_id);
create index chat_messages_thread_id_idx on public.chat_messages(thread_id);

-- Reuse the existing set_updated_at() helper (defined in the initial schema)
-- so edits stamp updated_at the same way posts do.
create trigger chat_messages_set_updated_at
  before update on public.chat_messages
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- chat_message_images
-- ---------------------------------------------------------------------------
create table public.chat_message_images (
  id         uuid  primary key default gen_random_uuid(),
  message_id uuid  not null references public.chat_messages(id) on delete cascade,
  image_url  text  not null,
  sort_order int   not null default 0
);

create index chat_message_images_message_id_idx on public.chat_message_images(message_id);

-- Cap at 4 images per message at the DB level (defense in depth — the app
-- also enforces this on upload).
create or replace function public.chat_check_message_image_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.chat_message_images where message_id = new.message_id) >= 4 then
    raise exception 'A chat message can have at most 4 images';
  end if;
  return new;
end;
$$;

create trigger chat_message_images_enforce_limit
  before insert on public.chat_message_images
  for each row execute function public.chat_check_message_image_limit();


-- ---------------------------------------------------------------------------
-- chat_reactions
-- ---------------------------------------------------------------------------
create table public.chat_reactions (
  id         uuid        primary key default gen_random_uuid(),
  message_id uuid        not null references public.chat_messages(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  emoji      text        not null check (emoji in ('👍', '🔥', '😍', '🤔')),
  created_at timestamptz not null default now(),

  unique (message_id, user_id, emoji)
);

create index chat_reactions_message_id_idx on public.chat_reactions(message_id);


-- =============================================================================
--  BUSINESS-LOGIC TRIGGERS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Cap room ownership at 5 per user
-- ---------------------------------------------------------------------------
create or replace function public.chat_check_room_owner_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.chat_rooms where owner_id = new.owner_id) >= 5 then
    raise exception 'You can only own up to 5 chat rooms at a time';
  end if;
  return new;
end;
$$;

create trigger chat_rooms_enforce_owner_limit
  before insert on public.chat_rooms
  for each row execute function public.chat_check_room_owner_limit();


-- ---------------------------------------------------------------------------
-- 2. Resolve (or create) the active thread for a room
--    SECURITY DEFINER so it can write to chat_threads even though ordinary
--    users have no direct INSERT/UPDATE grant on that table via RLS.
-- ---------------------------------------------------------------------------
create or replace function public.chat_get_active_thread(p_room_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_thread_id uuid;
begin
  select id into v_thread_id
  from public.chat_threads
  where room_id = p_room_id and is_archived = false
  order by created_at desc
  limit 1;

  if v_thread_id is null then
    insert into public.chat_threads (room_id) values (p_room_id)
    returning id into v_thread_id;
  end if;

  return v_thread_id;
end;
$$;

-- BEFORE INSERT: stamp new.thread_id from the resolver above whenever the
-- caller doesn't supply one (the app should never supply one directly).
create or replace function public.chat_messages_assign_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.thread_id is null then
    new.thread_id := public.chat_get_active_thread(new.room_id);
  end if;
  return new;
end;
$$;

create trigger chat_messages_before_insert_assign_thread
  before insert on public.chat_messages
  for each row execute function public.chat_messages_assign_thread();

-- AFTER INSERT: bump the thread's message_count (archiving it at 300 — the
-- next message will transparently get a fresh thread via the resolver
-- above), and bump the room's last_message_at for the 5-day cleanup check.
create or replace function public.chat_messages_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.chat_threads
    set message_count = message_count + 1,
        is_archived   = (message_count + 1) >= 300
    where id = new.thread_id;

  update public.chat_rooms
    set last_message_at = new.created_at
    where id = new.room_id;

  return new;
end;
$$;

create trigger chat_messages_after_insert_bump_thread
  after insert on public.chat_messages
  for each row execute function public.chat_messages_after_insert();


-- =============================================================================
--  ROW LEVEL SECURITY
-- =============================================================================

alter table public.chat_rooms          enable row level security;
alter table public.chat_room_members   enable row level security;
alter table public.chat_threads        enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.chat_message_images enable row level security;
alter table public.chat_reactions      enable row level security;

-- ---------------------------------------------------------------------------
--  chat_rooms
--  No delete policy at all — rooms are never user-deletable, even by the
--  owner. They only disappear via the cleanup Edge Function (service role,
--  bypasses RLS). The 5-room cap is enforced by the trigger above.
-- ---------------------------------------------------------------------------
create policy "chat_rooms: public read"
  on public.chat_rooms for select using (true);

create policy "chat_rooms: authenticated insert own"
  on public.chat_rooms for insert
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
--  chat_room_members
--  "Joining" is a self-service insert; users can also leave (delete own row).
--  No update policy — membership rows are just join-markers.
-- ---------------------------------------------------------------------------
create policy "chat_room_members: public read"
  on public.chat_room_members for select using (true);

create policy "chat_room_members: self join"
  on public.chat_room_members for insert
  with check (auth.uid() = user_id);

create policy "chat_room_members: self leave"
  on public.chat_room_members for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
--  chat_threads
--  Read-only from the client's perspective — no insert/update/delete policy
--  is granted to anon/authenticated. All writes happen inside the
--  SECURITY DEFINER trigger functions above, which run as the function
--  owner and are therefore not subject to these RLS policies.
-- ---------------------------------------------------------------------------
create policy "chat_threads: public read"
  on public.chat_threads for select using (true);

-- ---------------------------------------------------------------------------
--  chat_messages
--  - Select hides messages that belong to an archived thread.
--  - Insert requires (a) posting as yourself and (b) being a room member.
--  - Update/delete: author only.
-- ---------------------------------------------------------------------------
create policy "chat_messages: read non-archived"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id and t.is_archived = false
    )
  );

create policy "chat_messages: member insert"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_room_members m
      where m.room_id = chat_messages.room_id and m.user_id = auth.uid()
    )
  );

create policy "chat_messages: author update"
  on public.chat_messages for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_messages: author delete"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
--  chat_message_images
--  Mirrors chat_messages visibility (archived-thread images hidden too) and
--  ownership is resolved through the parent message.
-- ---------------------------------------------------------------------------
create policy "chat_message_images: read non-archived"
  on public.chat_message_images for select
  using (
    exists (
      select 1 from public.chat_messages m
      join public.chat_threads t on t.id = m.thread_id
      where m.id = chat_message_images.message_id and t.is_archived = false
    )
  );

create policy "chat_message_images: message owner insert"
  on public.chat_message_images for insert
  with check (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_images.message_id and m.user_id = auth.uid()
    )
  );

create policy "chat_message_images: message owner update"
  on public.chat_message_images for update
  using (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_images.message_id and m.user_id = auth.uid()
    )
  );

create policy "chat_message_images: message owner delete"
  on public.chat_message_images for delete
  using (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_images.message_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
--  chat_reactions
--  Anyone can react/un-react as themselves; the (message_id, user_id, emoji)
--  unique constraint stops the same emoji being pressed twice by one user.
-- ---------------------------------------------------------------------------
create policy "chat_reactions: public read"
  on public.chat_reactions for select using (true);

create policy "chat_reactions: self insert"
  on public.chat_reactions for insert
  with check (auth.uid() = user_id);

create policy "chat_reactions: self delete"
  on public.chat_reactions for delete
  using (auth.uid() = user_id);


-- =============================================================================
--  STORAGE: chat-images bucket
--  Upload path convention: chat-images/{userId}/{filename}  (owner-folder,
--  same pattern as post-images / stories).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  true,
  10485760,   -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "chat-images: public select"
  on storage.objects for select
  using (bucket_id = 'chat-images');

create policy "chat-images: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "chat-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'chat-images'
    and owner = auth.uid()
  );


-- =============================================================================
--  REALTIME
--  Adds chat_messages to the supabase_realtime publication so clients can
--  subscribe to new/edited/deleted messages. REPLICA IDENTITY FULL ensures
--  UPDATE/DELETE payloads include the full old row (needed for edit/delete
--  events, not just inserts).
-- =============================================================================

alter table public.chat_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;


-- =============================================================================
--  CLEANUP (5-day room expiry)
--  Physical deletion — including Storage files — is handled by the
--  cleanup-chat-rooms Edge Function (see supabase/functions/cleanup-chat-rooms/).
--  Deleting a chat_rooms row cascades to chat_room_members, chat_threads,
--  chat_messages, chat_message_images, and chat_reactions automatically.
--
--  Schedule via Dashboard → Edge Functions → cron trigger (e.g. hourly),
--  same as cleanup-stories, or invoke manually:
--    supabase functions invoke cleanup-chat-rooms
-- =============================================================================
