-- =============================================================================
--  MODELERS HUB — Color recipe tags (カラーレシピタグ)
--
--  Annotations placed on a post image: a pin marking a part of the photo, a
--  line, and a box holding a colour swatch plus free text. Pin and box carry
--  separate coordinates because the box is freely positioned.
--
--  Coordinates are stored as FRACTIONS OF THE IMAGE (0–1), not pixels — the
--  same image renders at many sizes (feed thumbnail, detail view, lightbox),
--  so pixel offsets would not survive. The frontend multiplies by the
--  rendered width/height.
--
--  The swatch colour is sampled from the photo at the pin position by the
--  frontend; this table only stores the resulting hex code.
--
--  Grants: not needed here. 20260620000002_grants.sql and
--  20260707000001_fix_service_role_grants.sql set default privileges on
--  future tables in `public` for anon / authenticated / service_role, and
--  the SQL Editor creates tables as `postgres`, so they are inherited.
--
--  RUN IN: Supabase SQL Editor (NOT yet applied — file only, per request).
-- =============================================================================

create table public.color_recipe_tags (
  id            uuid        primary key default gen_random_uuid(),
  post_image_id uuid        not null references public.post_images(id) on delete cascade,

  -- Pin: the point on the photo being described.
  pin_x         numeric     not null check (pin_x >= 0 and pin_x <= 1),
  pin_y         numeric     not null check (pin_y >= 0 and pin_y <= 1),

  -- Box: where the swatch + text sit; dragged independently of the pin.
  box_x         numeric     not null check (box_x >= 0 and box_x <= 1),
  box_y         numeric     not null check (box_y >= 0 and box_y <= 1),

  color_hex     text        not null check (color_hex ~* '^#[0-9a-f]{6}$'),

  -- Free text, optional so a tag can be placed first and written later.
  content       text        check (content is null or char_length(content) <= 200),

  sort_order    int         not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index color_recipe_tags_post_image_id_idx on public.color_recipe_tags(post_image_id);
-- Covers the only read pattern: every tag for one image, in display order.
create index color_recipe_tags_image_sort_idx    on public.color_recipe_tags(post_image_id, sort_order);

-- Reuse the set_updated_at() helper from the initial schema, as posts and
-- post_logs do.
create trigger color_recipe_tags_set_updated_at
  before update on public.color_recipe_tags
  for each row execute function public.set_updated_at();


-- =============================================================================
--  ROW LEVEL SECURITY
--  Ownership is two joins away: tag -> post_images -> posts.user_id.
-- =============================================================================

alter table public.color_recipe_tags enable row level security;

create policy "color_recipe_tags: public read"
  on public.color_recipe_tags for select using (true);

create policy "color_recipe_tags: post owner insert"
  on public.color_recipe_tags for insert
  with check (
    exists (
      select 1
      from public.post_images pi
      join public.posts p on p.id = pi.post_id
      where pi.id = post_image_id and p.user_id = auth.uid()
    )
  );

-- Both USING and WITH CHECK: without WITH CHECK an owner could re-point one
-- of their tags at an image belonging to someone else.
create policy "color_recipe_tags: post owner update"
  on public.color_recipe_tags for update
  using (
    exists (
      select 1
      from public.post_images pi
      join public.posts p on p.id = pi.post_id
      where pi.id = post_image_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.post_images pi
      join public.posts p on p.id = pi.post_id
      where pi.id = post_image_id and p.user_id = auth.uid()
    )
  );

create policy "color_recipe_tags: post owner delete"
  on public.color_recipe_tags for delete
  using (
    exists (
      select 1
      from public.post_images pi
      join public.posts p on p.id = pi.post_id
      where pi.id = post_image_id and p.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
