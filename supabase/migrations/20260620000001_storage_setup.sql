-- =============================================================================
--  MODELERS HUB — Storage Buckets & RLS
--  Run in Supabase SQL Editor (or: supabase db push)
-- =============================================================================


-- =============================================================================
--  BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,                                            -- public read via /object/public/
    5242880,                                         -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'post-images',
    'post-images',
    true,                                            -- public read via /object/public/
    10485760,                                        -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =============================================================================
--  STORAGE RLS POLICIES
--  Note: public buckets allow anonymous reads via the /object/public/ URL
--  without hitting RLS. Policies below govern write access and API reads.
-- =============================================================================

-- ---------------------------------------------------------------------------
--  avatars
--  Upload path: avatars/{userId}   (flat — no sub-folder)
--  The current AuthContext uploads as:
--    supabase.storage.from("avatars").upload(user.id, file, { upsert: true })
--  so the stored `name` is exactly the user's UUID string.
-- ---------------------------------------------------------------------------

-- Anyone can read (supports getPublicUrl + unauthenticated access)
create policy "avatars: public select"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Only the owner can upload to their own slot (name = auth.uid())
create policy "avatars: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name = auth.uid()::text
  );

-- Only the owner can overwrite their own avatar
create policy "avatars: owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );

-- Only the owner can delete their own avatar
create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );


-- ---------------------------------------------------------------------------
--  post-images
--  Upload path: post-images/{userId}/{filename}
--  The first path segment must match auth.uid() so users can only write
--  into their own folder. RLS is enforced at the folder level.
-- ---------------------------------------------------------------------------

-- Anyone can read
create policy "post-images: public select"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Authenticated users can upload to their own folder
create policy "post-images: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can replace files in their own folder
create policy "post-images: owner update"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and owner = auth.uid()
  );

-- Owners can delete files in their own folder
create policy "post-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and owner = auth.uid()
  );
