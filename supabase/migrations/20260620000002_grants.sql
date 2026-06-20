-- =============================================================================
--  MODELERS HUB — Role Grants
--
--  WHY THIS IS NEEDED:
--  Tables created via SQL do NOT automatically receive table-level grants to
--  the Supabase API roles (anon / authenticated). Without these grants,
--  PostgREST returns "permission denied for table X" before RLS is even
--  evaluated. Dashboard-created tables get these grants automatically; SQL
--  migrations must add them explicitly.
--
--  RUN IN: Supabase SQL Editor
-- =============================================================================

-- Allow both roles to use the public schema
grant usage on schema public to anon;
grant usage on schema public to authenticated;

-- anon: read-only (RLS "public read" policies restrict to visible rows)
grant select on all tables in schema public to anon;

-- authenticated: full CRUD (RLS policies restrict which rows each user can touch)
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Ensure future SQL-created tables also get these grants automatically
alter default privileges for role postgres in schema public
  grant select on tables to anon;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;
