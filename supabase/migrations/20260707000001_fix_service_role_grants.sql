-- =============================================================================
--  MODELERS HUB — Fix: service_role grants + pg_net extension
--
--  WHY THIS IS NEEDED:
--  20260620000002_grants.sql granted table access to `anon` and
--  `authenticated`, but never to `service_role`. GRANT and RLS are separate
--  layers — service_role bypasses RLS, but still needs table-level GRANTs to
--  touch a table at all. Without this, every Edge Function using the service
--  role key (cleanup-stories, cleanup-chat-rooms, translate) would silently
--  fail on any table operation with a permission-denied error.
--
--  Discovered 2026-07-07 while verifying the new cleanup-chat-rooms function:
--  cleanup-stories' hourly cron job had been failing silently for 10+ days
--  because of this gap (confirmed fixed — manual invoke returned
--  {"deleted":1,"storageFiles":1} afterwards). pg_net (required by pg_cron
--  jobs that call Edge Functions over HTTP) was also not enabled.
--
--  RUN IN: Supabase SQL Editor — already applied manually on 2026-07-07;
--  this file exists purely so a fresh/staging DB rebuilt from the migration
--  history gets the same fix, and so the fix is traceable in git history.
-- =============================================================================

-- Required by pg_cron jobs that invoke Edge Functions via net.http_post()
create extension if not exists pg_net;

-- service_role: full CRUD, bypassing RLS (as intended for service-role use)
grant select, insert, update, delete on all tables in schema public to service_role;

-- Ensure future SQL-created tables also grant service_role automatically
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;


-- ---------------------------------------------------------------------------
--  Reference only — NOT executed by this migration. A cron job was
--  registered manually via cron.schedule() (pg_cron jobid=4, job name
--  "cleanup-chat-rooms-hourly", schedule "0 * * * *", calling the
--  cleanup-chat-rooms Edge Function). Re-running cron.schedule() with the
--  same inputs is not guaranteed idempotent across pg_cron versions, so it's
--  intentionally left out of this file. Verify with:
--    select jobid, jobname, schedule, active from cron.job;
-- ---------------------------------------------------------------------------
