-- =============================================================================
--  MODELERS HUB — Bump Build Log image limit from 1 to 2
--  post_log_images was capped at 1 image per post log
--  (20260805000001_add_post_logs_feature.sql). Raising it to 2 to match the
--  new composer/editor UI, which now supports up to 2 photos per build log.
--
--  RUN IN: Supabase SQL Editor (not yet applied — file only, per request).
-- =============================================================================

create or replace function public.check_post_log_image_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.post_log_images where post_log_id = new.post_log_id) >= 2 then
    raise exception 'A post log can have at most 2 images';
  end if;
  return new;
end;
$$;

NOTIFY pgrst, 'reload schema';
