-- Add categories text[] column alongside existing category column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- Backfill from existing single-value category column
UPDATE public.posts SET categories = ARRAY[category] WHERE array_length(categories, 1) IS NULL;

-- Drop old category CHECK constraint (added in 20260628000002)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Drop old category column
ALTER TABLE public.posts DROP COLUMN IF EXISTS category;

-- Ensure empty arrays aren't possible after migration (belt-and-suspenders)
ALTER TABLE public.posts ALTER COLUMN categories SET DEFAULT '{"gunpla"}';
