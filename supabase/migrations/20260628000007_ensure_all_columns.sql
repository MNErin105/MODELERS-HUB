-- Comprehensive column-existence guard.
-- Safe to run multiple times (all statements are idempotent).
--
-- Covers every column added across recent sessions that may have been
-- missed if individual migrations were applied out of order or skipped.

-- ── allow_sns_repost (added in migration 003) ─────────────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS allow_sns_repost boolean NOT NULL DEFAULT true;

-- ── categories array (added in migration 004) ─────────────────────────────────
DO $$
DECLARE
  has_category   boolean;
  has_categories boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'category'
  ) INTO has_category;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'categories'
  ) INTO has_categories;

  IF NOT has_categories THEN
    EXECUTE 'ALTER TABLE public.posts ADD COLUMN categories text[] NOT NULL DEFAULT ''{}''';
  END IF;

  IF has_category THEN
    EXECUTE '
      UPDATE public.posts
      SET categories = ARRAY[category]
      WHERE array_length(categories, 1) IS NULL
    ';
    EXECUTE 'ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check';
    EXECUTE 'ALTER TABLE public.posts DROP COLUMN category';
  END IF;
END $$;

-- Rows that still have an empty categories array get a safe fallback
UPDATE public.posts
SET categories = ARRAY['other']
WHERE array_length(categories, 1) IS NULL;

-- ── Force PostgREST schema cache reload ───────────────────────────────────────
NOTIFY pgrst, 'reload schema';
