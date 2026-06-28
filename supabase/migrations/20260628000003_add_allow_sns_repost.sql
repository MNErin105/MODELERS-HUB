-- =============================================================================
--  Add allow_sns_repost column to posts table.
--  Default true — existing posts are treated as having given permission.
-- =============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS allow_sns_repost boolean NOT NULL DEFAULT true;
