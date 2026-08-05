-- =============================================================================
--  MODELERS HUB — Post Logs feature ("投稿記録")
--  Twitter-style short-form posts. Free-tier behavior only — a future
--  subscription tier (higher post frequency, etc.) is explicitly out of
--  scope for this migration.
--
--  RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
-- =============================================================================


-- =============================================================================
--  TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- post_logs
-- ---------------------------------------------------------------------------
create table public.post_logs (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  content         text        not null check (char_length(content) <= 280),
  linked_post_id  uuid        references public.posts(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create index post_logs_user_id_idx        on public.post_logs(user_id);
create index post_logs_linked_post_id_idx on public.post_logs(linked_post_id);
create index post_logs_created_at_idx     on public.post_logs(created_at);
-- Speeds up the "posts in the last 7 days" count the rate-limit trigger runs on every insert.
create index post_logs_user_created_idx   on public.post_logs(user_id, created_at);

-- Reuse the existing set_updated_at() helper (defined in the initial schema)
-- so edits stamp updated_at the same way posts/chat_messages do.
create trigger post_logs_set_updated_at
  before update on public.post_logs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- post_log_images
-- ---------------------------------------------------------------------------
create table public.post_log_images (
  id          uuid  primary key default gen_random_uuid(),
  post_log_id uuid  not null references public.post_logs(id) on delete cascade,
  image_url   text  not null,
  sort_order  int   not null default 0
);

create index post_log_images_post_log_id_idx on public.post_log_images(post_log_id);

-- Cap at 1 image per post log (defense in depth — the app also enforces
-- this on upload). Same pattern as chat_message_images' 4-image cap.
create or replace function public.check_post_log_image_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.post_log_images where post_log_id = new.post_log_id) >= 1 then
    raise exception 'A post log can have at most 1 image';
  end if;
  return new;
end;
$$;

create trigger post_log_images_enforce_limit
  before insert on public.post_log_images
  for each row execute function public.check_post_log_image_limit();


-- ---------------------------------------------------------------------------
-- post_log_likes
-- ---------------------------------------------------------------------------
create table public.post_log_likes (
  id          uuid        primary key default gen_random_uuid(),
  post_log_id uuid        not null references public.post_logs(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  unique (post_log_id, user_id)
);

create index post_log_likes_post_log_id_idx on public.post_log_likes(post_log_id);


-- ---------------------------------------------------------------------------
-- post_log_comments
-- ---------------------------------------------------------------------------
create table public.post_log_comments (
  id                 uuid        primary key default gen_random_uuid(),
  post_log_id        uuid        not null references public.post_logs(id) on delete cascade,
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  parent_comment_id  uuid        references public.post_log_comments(id) on delete cascade,
  content            text        not null,
  created_at         timestamptz not null default now()
);

create index post_log_comments_post_log_id_idx       on public.post_log_comments(post_log_id);
create index post_log_comments_parent_comment_id_idx on public.post_log_comments(parent_comment_id);


-- =============================================================================
--  BUSINESS-LOGIC TRIGGERS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Cap post_logs at 3 per user per rolling 7-day window (free tier)
-- ---------------------------------------------------------------------------
create or replace function public.check_post_log_weekly_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from public.post_logs
    where user_id = new.user_id
      and created_at > now() - interval '7 days'
  ) >= 3 then
    raise exception 'You can only post up to 3 post logs per 7-day period';
  end if;
  return new;
end;
$$;

create trigger post_logs_enforce_weekly_limit
  before insert on public.post_logs
  for each row execute function public.check_post_log_weekly_limit();


-- =============================================================================
--  ROW LEVEL SECURITY
-- =============================================================================

alter table public.post_logs         enable row level security;
alter table public.post_log_images   enable row level security;
alter table public.post_log_likes    enable row level security;
alter table public.post_log_comments enable row level security;

-- ---------------------------------------------------------------------------
--  post_logs
-- ---------------------------------------------------------------------------
create policy "post_logs: public read"
  on public.post_logs for select using (true);

create policy "post_logs: author insert"
  on public.post_logs for insert
  with check (auth.uid() = user_id);

create policy "post_logs: author update"
  on public.post_logs for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "post_logs: author delete"
  on public.post_logs for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
--  post_log_images
--  Ownership resolved through the parent post_log, same pattern as
--  chat_message_images / post_paint_tool_images.
-- ---------------------------------------------------------------------------
create policy "post_log_images: public read"
  on public.post_log_images for select using (true);

create policy "post_log_images: post log author insert"
  on public.post_log_images for insert
  with check (
    exists (select 1 from public.post_logs where id = post_log_id and user_id = auth.uid())
  );

create policy "post_log_images: post log author update"
  on public.post_log_images for update
  using (
    exists (select 1 from public.post_logs where id = post_log_id and user_id = auth.uid())
  );

create policy "post_log_images: post log author delete"
  on public.post_log_images for delete
  using (
    exists (select 1 from public.post_logs where id = post_log_id and user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
--  post_log_likes
-- ---------------------------------------------------------------------------
create policy "post_log_likes: public read"
  on public.post_log_likes for select using (true);

create policy "post_log_likes: self insert"
  on public.post_log_likes for insert
  with check (auth.uid() = user_id);

create policy "post_log_likes: self delete"
  on public.post_log_likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
--  post_log_comments
--  Public read. Insert is restricted to the post_log's own author,
--  regardless of parent_comment_id — replies from other users are not
--  supported at this stage (and shouldn't currently occur at all, but the
--  check applies uniformly as a safeguard either way).
-- ---------------------------------------------------------------------------
create policy "post_log_comments: public read"
  on public.post_log_comments for select using (true);

create policy "post_log_comments: post log author insert"
  on public.post_log_comments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.post_logs where id = post_log_id and user_id = auth.uid())
  );

create policy "post_log_comments: author update"
  on public.post_log_comments for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "post_log_comments: author delete"
  on public.post_log_comments for delete
  using (auth.uid() = user_id);
