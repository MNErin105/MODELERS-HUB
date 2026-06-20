-- =============================================================================
--  MODELERS HUB — Fix: profiles trigger + backfill
--
--  WHY THIS IS NEEDED:
--  The handle_new_user trigger fires on INSERT INTO auth.users (= first OAuth
--  login). If a user logged in before this trigger was installed, their
--  auth.users row exists but no profiles row was created. This causes FK
--  violations when inserting into posts.
--
--  This migration:
--  1. Re-creates the trigger function (idempotent via CREATE OR REPLACE).
--  2. Re-attaches the trigger (DROP + CREATE so it's guaranteed to exist).
--  3. Backfills profiles for any auth.users row that currently has no profile.
--
--  RUN IN: Supabase SQL Editor
-- =============================================================================


-- ── 1. Re-create trigger function ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username  text;
  final_username text;
  suffix         int := 0;
BEGIN
  -- Derive a URL-safe username from the email local part
  base_username := lower(
    regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '_', 'g')
  );
  base_username := left(base_username, 17);
  IF length(base_username) < 3 THEN
    base_username := 'user';
  END IF;

  -- Ensure uniqueness with a numeric suffix loop
  final_username := base_username;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = final_username
    );
    suffix := suffix + 1;
    final_username := left(base_username, 17) || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    final_username,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      final_username
    ),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;


-- ── 2. Re-attach trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 3. Backfill: create profiles for existing auth.users without one ─────────

DO $$
DECLARE
  r              RECORD;
  base_uname     text;
  final_uname    text;
  suffix_num     int;
BEGIN
  FOR r IN
    SELECT
      au.id,
      au.email,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Same username derivation logic as the trigger
    base_uname := lower(
      regexp_replace(split_part(r.email, '@', 1), '[^a-z0-9_]', '_', 'g')
    );
    base_uname := left(base_uname, 17);
    IF length(base_uname) < 3 THEN
      base_uname := 'user';
    END IF;

    final_uname := base_uname;
    suffix_num  := 0;
    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = final_uname
      );
      suffix_num  := suffix_num + 1;
      final_uname := left(base_uname, 17) || suffix_num::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
      r.id,
      final_uname,
      COALESCE(
        r.raw_user_meta_data->>'full_name',
        r.raw_user_meta_data->>'name',
        final_uname
      ),
      NULL
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Backfilled profile for user % — username: %', r.id, final_uname;
  END LOOP;
END $$;


-- ── 4. Confirm results ───────────────────────────────────────────────────────

-- After running, this query should return 0 rows:
-- SELECT au.id, au.email
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- WHERE p.id IS NULL;
