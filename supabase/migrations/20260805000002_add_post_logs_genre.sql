-- =============================================================================
--  MODELERS HUB — Add genre to Build Logs (post_logs)
--  Every build log must now carry one genre from the same set used by
--  posts.categories, independent of whether a work is linked.
--
--  DB values match CATEGORY_TO_DB in lib/supabase/queries.ts. Unlike
--  posts.categories (which lost its CHECK constraint during migration
--  history — see 20260628000004/000006), this column keeps one from the
--  start.
--
--  RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
-- =============================================================================

alter table public.post_logs
  add column genre text not null default 'other';

alter table public.post_logs
  add constraint post_logs_genre_check
  check (genre in (
    'gunpla', 'military', 'car_model', 'character_model',
    'diorama', 'fighter', 'figure', 'other'
  ));

-- Existing rows (3 as of writing) backfill to 'other' via the column default
-- above; no separate UPDATE needed.

create index post_logs_genre_idx on public.post_logs(genre);

-- Force PostgREST to pick up the new column immediately.
NOTIFY pgrst, 'reload schema';
