-- =============================================================================
--  Add 'fighter' to the posts.category CHECK constraint.
--
--  PostgreSQL does not support ALTER TABLE ... ALTER CONSTRAINT, so we must
--  drop the old constraint and recreate it with the new value added.
-- =============================================================================

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_category_check CHECK (
    category IN (
      'gunpla',
      'military',
      'car_model',
      'character_model',
      'diorama',
      'fighter',
      'figure',
      'other'
    )
  );
