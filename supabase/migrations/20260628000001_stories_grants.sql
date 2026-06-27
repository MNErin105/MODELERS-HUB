-- =============================================================================
--  Explicit grants for the stories table.
--
--  WHY: The stories table was created after the initial grants migration ran.
--  "GRANT SELECT ON ALL TABLES IN SCHEMA public" only covers tables that
--  existed at the time of execution. ALTER DEFAULT PRIVILEGES should cover
--  new tables, but we add explicit grants here to be safe and to make the
--  intent clear.
-- =============================================================================

grant select
  on public.stories
  to anon, authenticated;

grant insert, update, delete
  on public.stories
  to authenticated;
