-- =============================================================================
--  MODELERS HUB — Drop the paints/tools reference photos feature
--
--  WHY: The "使用した塗料・工具の写真" section of the New Post form is replaced
--  by colour recipe tags (20260812000000_add_color_recipe_tags.sql), which
--  record the same information — what paint went where — directly on the
--  build photos instead of in a separate, unlabelled photo strip.
--  - Frontend code has already been removed from the repo in the same
--    change that added this migration file: the paintToolImages state,
--    handlers and <Section> in components/post/NewPostForm.tsx, its upload
--    + insert step in the submit handler, the RawPaintToolImage type, the
--    post_paint_tool_images embed in POST_SELECT and the merge into
--    Post.images in lib/supabase/queries.ts, WorkPhoto.isPaintTool in
--    lib/types.ts, and the PAINT/TOOL thumbnail badge in
--    components/post/WorksTab.tsx.
--  - i18n keys (newPost.sections.paintTools, newPost.paintToolImageHint)
--    have already been removed from messages/ja.json and messages/en.json.
--  - EditPostForm.tsx never had this UI, so nothing there to remove.
--  - Confirmed via PostgREST count that the table has 0 rows (against 16
--    posts / 124 post_images), so no user content is lost by dropping it.
--  - No dedicated Storage bucket: these photos shared the post-images
--    bucket under a per-post path prefix, and since there are no rows,
--    there is nothing to clean up there either.
--
--  STATUS: NOT YET APPLIED. This file has NOT been executed — the table
--  still exists in the database as of this writing. The frontend no longer
--  reads or writes it, so the app does not depend on it, but the DROP
--  below still needs to be run.
--
--  RUN IN: Supabase SQL Editor. The statement is idempotent via IF EXISTS,
--  so re-running this file after it succeeds once is harmless.
--
--  The original 20260705000000_add_post_paint_tool_images.sql is left
--  unmodified — it remains as a historical record of what was created.
-- =============================================================================

-- RLS policies and indexes are dropped automatically along with the table.
drop table if exists public.post_paint_tool_images cascade;

NOTIFY pgrst, 'reload schema';
