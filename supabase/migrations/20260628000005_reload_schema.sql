-- After adding the categories text[] column, PostgREST's schema cache may be
-- stale and not yet aware of the new column. This causes all post queries to
-- fail silently (returning data: null), which shows "No posts yet." on the home
-- page even though the database rows still exist.
--
-- Force PostgREST to reload its schema cache immediately.
NOTIFY pgrst, 'reload schema';
