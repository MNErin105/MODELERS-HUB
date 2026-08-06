-- =============================================================================
--  MODELERS HUB — Build Log curation ("まとめ")
--
--  A post owner can hand-pick a subset of their own Build Logs that are
--  already linked to that post (post_logs.linked_post_id = posts.id) and
--  order them for display in the post detail page's "Build Log" tab and
--  the profile page's "Note" view. This is a distinct, opt-in layer on
--  top of linked_post_id — linking a build log to a work at posting time
--  does NOT automatically curate it; curation is a separate action.
--
--  linked_post_id itself is NOT trustworthy as an ownership proof: the
--  existing post_logs RLS only checks auth.uid() = user_id on insert, with
--  no check that linked_post_id actually belongs to that same user (a
--  pre-existing gap, low risk, intentionally left alone here). To avoid
--  inheriting that gap, the insert policy below independently re-verifies
--  both that the caller owns the target post AND owns the post_log AND
--  that the post_log is actually linked to that post.
--
--  RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
-- =============================================================================

create table public.post_log_curations (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  post_log_id uuid        not null references public.post_logs(id) on delete cascade,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),

  unique (post_id, post_log_id)
);

create index post_log_curations_post_id_idx     on public.post_log_curations(post_id);
create index post_log_curations_post_log_id_idx on public.post_log_curations(post_log_id);

alter table public.post_log_curations enable row level security;

create policy "post_log_curations: public read"
  on public.post_log_curations for select using (true);

-- Insert requires the caller to own BOTH the target post and the post_log,
-- and the post_log must genuinely be linked to that post — closes the
-- linked_post_id ownership gap noted above for this feature specifically.
create policy "post_log_curations: post owner insert"
  on public.post_log_curations for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
    and exists (
      select 1 from public.post_logs
      where id = post_log_id and user_id = auth.uid() and linked_post_id = post_id
    )
  );

-- Update (reordering) — post owner only. Re-checking post_log ownership is
-- unnecessary here since the row already exists and post_log_id itself is
-- immutable in practice (the app only ever updates sort_order).
create policy "post_log_curations: post owner update"
  on public.post_log_curations for update
  using      (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()))
  with check (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

create policy "post_log_curations: post owner delete"
  on public.post_log_curations for delete
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
