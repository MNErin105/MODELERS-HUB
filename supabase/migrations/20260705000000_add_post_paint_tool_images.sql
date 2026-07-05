-- =============================================================================
--  Add post_paint_tool_images table
--  Separate gallery for paint/tool reference photos, same pattern as
--  build_journal_entries (own table, not mixed into post_images).
-- =============================================================================

create table public.post_paint_tool_images (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  image_url   text        not null,
  caption     text,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create index post_paint_tool_images_post_id_idx on public.post_paint_tool_images(post_id);

alter table public.post_paint_tool_images enable row level security;

create policy "post_paint_tool_images: public read"
  on public.post_paint_tool_images for select using (true);

create policy "post_paint_tool_images: post owner insert"
  on public.post_paint_tool_images for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_paint_tool_images: post owner update"
  on public.post_paint_tool_images for update
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_paint_tool_images: post owner delete"
  on public.post_paint_tool_images for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );
