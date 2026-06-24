-- =============================================================================
--  Add post_tools and post_techniques tables
--  Tools and techniques were stored only in client state and never persisted.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- post_tools
-- ---------------------------------------------------------------------------
create table public.post_tools (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references public.posts(id) on delete cascade,
  tool_name text not null
);

create index post_tools_post_id_idx on public.post_tools(post_id);

alter table public.post_tools enable row level security;

create policy "post_tools: public read"
  on public.post_tools for select using (true);

create policy "post_tools: post owner insert"
  on public.post_tools for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_tools: post owner delete"
  on public.post_tools for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );


-- ---------------------------------------------------------------------------
-- post_techniques
-- ---------------------------------------------------------------------------
create table public.post_techniques (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.posts(id) on delete cascade,
  technique_name text not null
);

create index post_techniques_post_id_idx on public.post_techniques(post_id);

alter table public.post_techniques enable row level security;

create policy "post_techniques: public read"
  on public.post_techniques for select using (true);

create policy "post_techniques: post owner insert"
  on public.post_techniques for insert
  with check (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );

create policy "post_techniques: post owner delete"
  on public.post_techniques for delete
  using (
    exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
  );
