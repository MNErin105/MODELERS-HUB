-- =============================================================================
--  Add build_journal_entry_images table
--  Lets each build journal entry hold multiple photos, same pattern as
--  post_paint_tool_images. Ownership is checked by joining through
--  build_journal_entries to posts, since this table has no post_id of its own.
-- =============================================================================

create table public.build_journal_entry_images (
  id          uuid        primary key default gen_random_uuid(),
  entry_id    uuid        not null references public.build_journal_entries(id) on delete cascade,
  image_url   text        not null,
  caption     text,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create index build_journal_entry_images_entry_id_idx on public.build_journal_entry_images(entry_id);

alter table public.build_journal_entry_images enable row level security;

create policy "build_journal_entry_images: public read"
  on public.build_journal_entry_images for select using (true);

create policy "build_journal_entry_images: post owner insert"
  on public.build_journal_entry_images for insert
  with check (
    exists (
      select 1 from public.build_journal_entries e
      join public.posts p on p.id = e.post_id
      where e.id = entry_id and p.user_id = auth.uid()
    )
  );

create policy "build_journal_entry_images: post owner update"
  on public.build_journal_entry_images for update
  using (
    exists (
      select 1 from public.build_journal_entries e
      join public.posts p on p.id = e.post_id
      where e.id = entry_id and p.user_id = auth.uid()
    )
  );

create policy "build_journal_entry_images: post owner delete"
  on public.build_journal_entry_images for delete
  using (
    exists (
      select 1 from public.build_journal_entries e
      join public.posts p on p.id = e.post_id
      where e.id = entry_id and p.user_id = auth.uid()
    )
  );
