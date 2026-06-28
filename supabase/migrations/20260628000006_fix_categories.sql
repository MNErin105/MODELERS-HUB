-- Idempotent fix for the categories migration.
-- Handles all possible DB states regardless of whether migration 004 ran
-- fully, partially, or not at all.
--
-- State A: category exists, categories does not → migration 004 never ran / rolled back
-- State B: category exists, categories exists  → migration 004 ran partially
-- State C: category does not exist, categories exists → migration 004 ran fully (ideal)

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

  -- Step 1: add categories column if missing
  IF NOT has_categories THEN
    EXECUTE 'ALTER TABLE public.posts ADD COLUMN categories text[] NOT NULL DEFAULT ''{}''';
  END IF;

  -- Step 2: backfill from old category column if it still exists
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

-- Step 3: any rows that still have an empty array get a safe fallback
UPDATE public.posts
SET categories = ARRAY['other']
WHERE array_length(categories, 1) IS NULL;

-- Step 4: force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
