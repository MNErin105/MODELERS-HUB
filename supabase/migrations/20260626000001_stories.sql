-- =============================================================================
--  MODELERS HUB — Stories feature
--  Instagram-style ephemeral posts (auto-expire after 24 hours).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- stories table
-- ---------------------------------------------------------------------------
create table public.stories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  image_url  text        not null,
  caption    text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index stories_user_id_idx    on public.stories(user_id);
create index stories_expires_at_idx on public.stories(expires_at);

alter table public.stories enable row level security;

-- Only non-expired stories are visible to everyone
create policy "stories: public read (active only)"
  on public.stories for select
  using (expires_at > now());

-- Authenticated users can post their own stories
create policy "stories: authenticated insert"
  on public.stories for insert
  with check (auth.uid() = user_id);

-- Only the owner can delete their story
create policy "stories: owner delete"
  on public.stories for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- Storage bucket: stories
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stories',
  'stories',
  true,
  10485760,   -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (CDN URL access)
create policy "stories-storage: public select"
  on storage.objects for select
  using (bucket_id = 'stories');

-- Authenticated users upload into their own folder: stories/{userId}/...
create policy "stories-storage: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'stories'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own files
create policy "stories-storage: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'stories'
    and owner = auth.uid()
  );


-- ---------------------------------------------------------------------------
-- Cleanup: physical deletion of expired rows
--
-- Option A — pg_cron (requires pg_cron extension enabled in Supabase dashboard)
--   Dashboard → Database → Extensions → enable "pg_cron", then run:
--
--   select cron.schedule(
--     'cleanup-expired-stories',
--     '0 * * * *',   -- every hour
--     $$ delete from public.stories where expires_at < now(); $$
--   );
--
--   Note: pg_cron only deletes DB rows; Storage files must be cleaned up
--   separately via the Edge Function (see supabase/functions/cleanup-stories/).
--
-- Option B — Supabase Edge Function (see supabase/functions/cleanup-stories/)
--   Handles both DB rows AND Storage file deletion.
--   Schedule via Dashboard → Edge Functions → cron trigger, or call manually.
-- ---------------------------------------------------------------------------
