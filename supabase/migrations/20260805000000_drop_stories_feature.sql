-- =============================================================================
--  MODELERS HUB — Drop Stories feature
--
--  WHY: Product direction shifted to narrow the site's feature surface. The
--  Stories feature (introduced in 20260626000001_stories.sql, granted in
--  20260628000001_stories_grants.sql) was first hidden behind a
--  NEXT_PUBLIC_FEATURE_STORIES_ENABLED flag, then fully removed:
--  - Frontend code (components/story/, lib/supabase/storiesQueries.ts, the
--    Story type, the feature flag, and all call sites in HomeContent.tsx)
--    deleted from the repo in the same change as this migration.
--  - cleanup-stories-hourly pg_cron job: unscheduled.
--  - cleanup-stories Edge Function: deleted (`supabase functions delete
--    cleanup-stories`) and its source removed from supabase/functions/.
--  - stories Storage bucket: deleted via Dashboard (was already empty).
--  - stories table: dropped.
--
--  This migration is a RECORD of what was already run manually in the
--  Supabase SQL Editor / Dashboard on 2026-08-05 — it is not being
--  (re-)applied by running this file, since the table/bucket no longer
--  exist. It exists so the removal is traceable in migration history and
--  so a fresh/staging DB rebuilt from migrations ends up in the same state
--  (the drop statements below are idempotent via IF EXISTS).
--
--  The original 20260626000001_stories.sql and 20260628000001_stories_grants.sql
--  files are left unmodified — they remain as a historical record of what
--  was originally created.
-- =============================================================================

-- Table (RLS policies are dropped automatically along with the table)
drop table if exists public.stories cascade;

-- Storage bucket + its objects/policies
delete from storage.objects where bucket_id = 'stories';
delete from storage.buckets where id = 'stories';

drop policy if exists "stories-storage: public select" on storage.objects;
drop policy if exists "stories-storage: owner insert"  on storage.objects;
drop policy if exists "stories-storage: owner delete"  on storage.objects;

-- pg_cron job (name as originally scheduled per 20260626000001_stories.sql's
-- suggested Option A). No-op if it was never registered under this name.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-stories-hourly') then
    perform cron.unschedule('cleanup-stories-hourly');
  end if;
end $$;
