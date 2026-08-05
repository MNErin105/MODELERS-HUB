-- =============================================================================
--  MODELERS HUB — Drop WIP (制作記録 / Build Journal) feature
--
--  WHY: Product direction narrowed the site's feature surface, same
--  rationale as 20260805000000_drop_stories_feature.sql. The WIP / build
--  journal feature (post detail "Build Journal" tab, optional WIP section
--  in the New Post form, profile "WIP" tab) is removed entirely:
--  - Frontend code (components/post/WIPStepEditor.tsx,
--    components/post/BuildJournalTab.tsx, all WIP state/handlers/JSX in
--    NewPostForm.tsx, journal cleanup code in EditPostForm.tsx, the
--    "journal" tab in PostDetailClient.tsx, buildSteps wiring in
--    getPostById/app/posts/[id]/page.tsx, the BuildStep/BuildStepImage
--    types, and the profile "wip" tab in ProfilePageClient.tsx) has
--    already been deleted from the repo in the same change that added
--    this migration file.
--  - i18n keys (post.tabs.journal, profile.tabs.wip, newPost.sections.wip,
--    newPost.wip.*) have already been removed from messages/ja.json and
--    messages/en.json.
--  - Confirmed via Dashboard query that both tables have 0 real rows —
--    the profile "WIP" tab had in fact been non-functional since its
--    creation (getPostsByUserId never populated Post.buildSteps), so no
--    working functionality will be lost by dropping them.
--  - No dedicated Storage bucket exists for WIP images (they shared the
--    post-images bucket under a per-post path prefix); nothing to clean up
--    there.
--
--  STATUS: NOT YET APPLIED. Unlike 20260805000000_drop_stories_feature.sql
--  (written after the drop was already run manually, as a historical
--  record), this file has NOT been executed yet — the tables still exist
--  in the database as of this writing. The frontend code that referenced
--  them has already been removed, so the app no longer depends on these
--  tables, but the DROP statements below still need to be run.
--
--  RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
--  The drop statements are idempotent via IF EXISTS, so re-running this
--  file after it succeeds once is harmless.
--
--  The original 20260620000000_initial_schema.sql (build_journal_entries)
--  and 20260706000000_add_build_journal_entry_images.sql
--  (build_journal_entry_images) files are left unmodified — they remain as
--  a historical record of what was originally created.
-- =============================================================================

-- Tables (RLS policies are dropped automatically along with each table).
-- build_journal_entry_images references build_journal_entries, so drop it
-- first even though cascade would handle the ordering either way.
drop table if exists public.build_journal_entry_images cascade;
drop table if exists public.build_journal_entries cascade;

NOTIFY pgrst, 'reload schema';
