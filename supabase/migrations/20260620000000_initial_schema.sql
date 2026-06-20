-- =============================================================================
--  MODELERS HUB — Initial Schema
--  Run this in Supabase SQL Editor (or via: supabase db push)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()


-- =============================================================================
--  TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
--    One row per authenticated user. Created on first login via trigger or
--    explicitly from the app after Google OAuth completes.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  username     text        not null unique,
  display_name text        not null,
  bio          text,
  avatar_url   text,
  country      text,
  created_at   timestamptz not null default now()
);

-- Enforce URL-safe handle format at the DB level
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9_]{3,20}$');


-- ---------------------------------------------------------------------------
-- 2. posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  category    text        not null,
  title       text        not null,
  description text,
  kit_name    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint posts_category_check check (
    category in (
      'gunpla', 'military', 'car_model', 'character_model',
      'diorama', 'figure', 'other'
    )
  )
);

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. post_images
-- ---------------------------------------------------------------------------
create table public.post_images (
  id            uuid  primary key default gen_random_uuid(),
  post_id       uuid  not null references public.posts(id) on delete cascade,
  image_url     text  not null,
  caption       text,
  author_comment text,
  sort_order    int   not null default 0
);

create index post_images_post_id_idx on public.post_images(post_id);


-- ---------------------------------------------------------------------------
-- 4. tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);


-- ---------------------------------------------------------------------------
-- 5. post_tags
-- ---------------------------------------------------------------------------
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tags_tag_id_idx on public.post_tags(tag_id);


-- ---------------------------------------------------------------------------
-- 6. post_paints
-- ---------------------------------------------------------------------------
create table public.post_paints (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  paint_name text not null
);

create index post_paints_post_id_idx on public.post_paints(post_id);


-- ---------------------------------------------------------------------------
-- 7. likes
-- ---------------------------------------------------------------------------
create table public.likes (
  post_id    uuid        not null references public.posts(id)    on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index likes_user_id_idx on public.likes(user_id);


-- ---------------------------------------------------------------------------
-- 8. bookmarks
-- ---------------------------------------------------------------------------
create table public.bookmarks (
  post_id    uuid        not null references public.posts(id)    on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index bookmarks_user_id_idx on public.bookmarks(user_id);


-- ---------------------------------------------------------------------------
-- 9. comments
-- ---------------------------------------------------------------------------
create table public.comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id)    on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments(post_id);


-- ---------------------------------------------------------------------------
-- 10. follows
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id  uuid        not null references public.profiles(id) on delete cascade,
  following_id uuid        not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows(following_id);


-- ---------------------------------------------------------------------------
-- 11. build_journal_entries
-- ---------------------------------------------------------------------------
create table public.build_journal_entries (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  title       text,
  content     text,
  image_url   text,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create index build_journal_entries_post_id_idx on public.build_journal_entries(post_id);


-- =============================================================================
--  ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles              enable row level security;
alter table public.posts                 enable row level security;
alter table public.post_images           enable row level security;
alter table public.tags                  enable row level security;
alter table public.post_tags             enable row level security;
alter table public.post_paints           enable row level security;
alter table public.likes                 enable row level security;
alter table public.bookmarks             enable row level security;
alter table public.comments              enable row level security;
alter table public.follows               enable row level security;
alter table public.build_journal_entries enable row level security;


-- ---------------------------------------------------------------------------
--  profiles
-- ---------------------------------------------------------------------------
create policy "profiles: public read"
  on public.profiles for select using (true);

create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using      (auth.uid() = id)
  with check (auth.uid() = id);


-- ---------------------------------------------------------------------------
--  posts
-- ---------------------------------------------------------------------------
create policy "posts: public read"
  on public.posts for select using (true);

create policy "posts: owner insert"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "posts: owner update"
  on public.posts for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "posts: owner delete"
  on public.posts for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
--  post_images
-- ---------------------------------------------------------------------------
create policy "post_images: public read"
  on public.post_images for select using (true);

create policy "post_images: post owner insert"
  on public.post_images for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_images: post owner update"
  on public.post_images for update
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_images: post owner delete"
  on public.post_images for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );


-- ---------------------------------------------------------------------------
--  tags  (managed by app; anyone can read, only owners via post_tags write)
-- ---------------------------------------------------------------------------
create policy "tags: public read"
  on public.tags for select using (true);

create policy "tags: authenticated insert"
  on public.tags for insert
  with check (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------------
--  post_tags
-- ---------------------------------------------------------------------------
create policy "post_tags: public read"
  on public.post_tags for select using (true);

create policy "post_tags: post owner insert"
  on public.post_tags for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_tags: post owner delete"
  on public.post_tags for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );


-- ---------------------------------------------------------------------------
--  post_paints
-- ---------------------------------------------------------------------------
create policy "post_paints: public read"
  on public.post_paints for select using (true);

create policy "post_paints: post owner insert"
  on public.post_paints for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_paints: post owner update"
  on public.post_paints for update
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_paints: post owner delete"
  on public.post_paints for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );


-- ---------------------------------------------------------------------------
--  likes
-- ---------------------------------------------------------------------------
create policy "likes: public read"
  on public.likes for select using (true);

create policy "likes: owner insert"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes: owner delete"
  on public.likes for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
--  bookmarks
-- ---------------------------------------------------------------------------
create policy "bookmarks: public read"
  on public.bookmarks for select using (true);

create policy "bookmarks: owner insert"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "bookmarks: owner delete"
  on public.bookmarks for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
--  comments
-- ---------------------------------------------------------------------------
create policy "comments: public read"
  on public.comments for select using (true);

create policy "comments: authenticated insert"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments: owner update"
  on public.comments for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "comments: owner delete"
  on public.comments for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
--  follows
-- ---------------------------------------------------------------------------
create policy "follows: public read"
  on public.follows for select using (true);

create policy "follows: owner insert"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows: owner delete"
  on public.follows for delete
  using (auth.uid() = follower_id);


-- ---------------------------------------------------------------------------
--  build_journal_entries
-- ---------------------------------------------------------------------------
create policy "build_journal_entries: public read"
  on public.build_journal_entries for select using (true);

create policy "build_journal_entries: post owner insert"
  on public.build_journal_entries for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "build_journal_entries: post owner update"
  on public.build_journal_entries for update
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "build_journal_entries: post owner delete"
  on public.build_journal_entries for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );


-- =============================================================================
--  OPTIONAL: Auto-create profile row on first sign-in
--  This trigger fires when a new user is inserted into auth.users,
--  creating a stub profiles row so RLS never blocks the first session.
--  The app should update username / display_name immediately after OAuth.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  -- Derive a candidate username from the email local part
  base_username := lower(
    regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '_', 'g')
  );
  base_username := left(base_username, 17);  -- leave room for suffix digits
  if length(base_username) < 3 then
    base_username := 'user';
  end if;

  -- Ensure uniqueness by appending a numeric suffix if needed
  final_username := base_username;
  loop
    exit when not exists (select 1 from public.profiles where username = final_username);
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', final_username),
    null   -- avatar comes from Supabase Storage, not Google
  )
  on conflict (id) do nothing;   -- safe to re-fire

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
