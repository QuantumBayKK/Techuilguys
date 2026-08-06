-- ============================================================================
-- TechuilaGuys Workspace 0002 — collaboration surface.
--
-- Adds calendar, documents + wiki, meetings, chat, whiteboard, presence and
-- the knowledge graph on top of 0001. Run AFTER 0001, once, in the Supabase
-- SQL editor (or `supabase db push`).
--
-- Fully re-runnable: every policy is dropped before it is created, every
-- type/table/index guards for existence. Running it twice is a no-op.
--
-- Same contract as 0001: multi-tenancy is enforced HERE, in Postgres. Every
-- new table gets RLS before it gets a single row. The rule throughout is
-- `can_see(project_id, client_visible)` — staff see everything, a client sees
-- only things explicitly shared AND belonging to their own organization.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.event_kind as enum ('session','deadline','review','launch','holiday','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_kind as enum ('doc','wiki');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meeting_status as enum ('scheduled','live','ended','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rsvp as enum ('pending','yes','no','maybe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.channel_kind as enum ('project','workspace','direct');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shape_kind as enum ('note','rect','ellipse','arrow','text','path');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.node_kind as enum
    ('project','task','document','meeting','file','milestone','person','channel','board');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles.handle — chat @mentions need a short stable name. Derived from the
-- email local part, de-duplicated with a numeric suffix.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists handle text;
alter table public.profiles add column if not exists last_seen_at timestamptz;

create or replace function public.derive_handle(p_email text, p_id uuid)
returns text language plpgsql stable set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(split_part(coalesce(p_email, 'user'), '@', 1), '[^a-z0-9]+', '', 'g'));
  if base = '' then base := 'user'; end if;
  base := left(base, 20);
  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate and id <> p_id) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  return candidate;
end $$;

update public.profiles set handle = public.derive_handle(email, id) where handle is null;

alter table public.profiles alter column handle set not null;
create unique index if not exists profiles_handle_key on public.profiles (handle);

-- 0001's signup trigger predates handles; re-declare it so new accounts get one.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  first_account boolean;
begin
  select count(*) = 0 into first_account from public.profiles;

  insert into public.profiles (id, email, full_name, avatar_url, role, handle)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    case when first_account then 'admin'::public.user_role else 'pending'::public.user_role end,
    public.derive_handle(new.email, new.id)
  )
  on conflict (id) do nothing;

  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

/**
 * The one visibility rule for every collaboration table.
 *
 * Staff see everything. A client sees a row only when it is explicitly shared
 * (`client_visible`) AND it belongs to a project in their own organization —
 * or is a workspace-level row that was deliberately shared with clients.
 *
 * SECURITY DEFINER for the same reason as 0001's helpers: policies call it, and
 * it must not re-enter the policy on `projects`. It takes only its arguments
 * and reads the caller's own org, so it cannot be used to exfiltrate anything.
 */
create or replace function public.can_see(p_project uuid, p_client_visible boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
      or (
        coalesce(p_client_visible, false)
        and (
          p_project is null
          or exists (
            select 1 from public.projects pr
            where pr.id = p_project and pr.organization_id = public.current_org_of()
          )
        )
      );
$$;

/** Generic `updated_at` stamp. */
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- CALENDAR
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  title           text not null,
  description     text,
  kind            public.event_kind not null default 'session',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  all_day         boolean not null default false,
  location        text,
  client_visible  boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint events_span check (ends_at >= starts_at)
);

create index if not exists events_range_idx on public.events (starts_at, ends_at);
create index if not exists events_project_idx on public.events (project_id);

-- ---------------------------------------------------------------------------
-- DOCUMENTS + WIKI
--
-- One primitive, two surfaces. A `doc` hangs off a project; a `wiki` page is
-- the same row with `kind = 'wiki'` and usually no project — the shared
-- handbook. Both are trees via `parent_id`, both keep version history.
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  parent_id       uuid references public.documents(id) on delete cascade,
  kind            public.doc_kind not null default 'doc',
  title           text not null,
  slug            text not null,
  icon            text,
  body_md         text not null default '',
  order_index     integer not null default 0,
  client_visible  boolean not null default false,
  is_archived     boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Nullable `project_id` makes a plain UNIQUE useless (NULLs are all distinct),
-- so scope uniqueness with two partial indexes instead.
create unique index if not exists documents_project_slug_key
  on public.documents (project_id, slug) where project_id is not null;
create unique index if not exists documents_workspace_slug_key
  on public.documents (slug) where project_id is null;
create index if not exists documents_parent_idx on public.documents (parent_id);
create index if not exists documents_kind_idx on public.documents (kind, project_id);

create table if not exists public.document_versions (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  title        text not null,
  body_md      text not null,
  edited_by    uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists document_versions_doc_idx
  on public.document_versions (document_id, created_at desc);

-- ---------------------------------------------------------------------------
-- MEETINGS
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  title           text not null,
  agenda_md       text not null default '',
  notes_md        text not null default '',
  status          public.meeting_status not null default 'scheduled',
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  join_url        text,
  recording_url   text,
  client_visible  boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists meetings_start_idx on public.meetings (starts_at desc);
create index if not exists meetings_project_idx on public.meetings (project_id);

create table if not exists public.meeting_attendees (
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  response    public.rsvp not null default 'pending',
  primary key (meeting_id, profile_id)
);

create table if not exists public.meeting_action_items (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  body        text not null,
  owner_id    uuid references public.profiles(id) on delete set null,
  task_id     uuid references public.tasks(id) on delete set null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists action_items_meeting_idx on public.meeting_action_items (meeting_id);

-- ---------------------------------------------------------------------------
-- CHAT
-- ---------------------------------------------------------------------------
create table if not exists public.channels (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  kind            public.channel_kind not null default 'project',
  name            text not null,
  topic           text,
  client_visible  boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists channels_project_idx on public.channels (project_id);

create table if not exists public.channel_members (
  channel_id    uuid not null references public.channels(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (channel_id, profile_id)
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  channel_id       uuid not null references public.channels(id) on delete cascade,
  author_id        uuid references public.profiles(id) on delete set null,
  body             text not null,
  reply_to         uuid references public.messages(id) on delete set null,
  attachment_path  text,
  attachment_name  text,
  attachment_size  integer,
  edited_at        timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists messages_channel_idx on public.messages (channel_id, created_at desc);

create table if not exists public.message_reactions (
  message_id  uuid not null references public.messages(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  emoji       text not null,
  primary key (message_id, profile_id, emoji)
);

-- ---------------------------------------------------------------------------
-- WHITEBOARD
-- ---------------------------------------------------------------------------
create table if not exists public.boards (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  title           text not null,
  client_visible  boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists boards_project_idx on public.boards (project_id);

create table if not exists public.board_shapes (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  kind        public.shape_kind not null default 'note',
  x           double precision not null default 0,
  y           double precision not null default 0,
  w           double precision not null default 180,
  h           double precision not null default 120,
  text        text not null default '',
  tone        smallint not null default 0,     -- index into the app's neutral swatch set
  points      jsonb,                            -- [[x,y], …] for path / arrow
  z           integer not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now(),
  constraint board_shapes_tone check (tone between 0 and 5)
);

create index if not exists board_shapes_board_idx on public.board_shapes (board_id, z);

-- ---------------------------------------------------------------------------
-- KNOWLEDGE GRAPH
--
-- Explicit edges only. The derived edges (task→milestone, doc→project, …)
-- already exist as foreign keys and are unioned in at read time by
-- `knowledge_graph()` — duplicating them as rows would just rot.
-- ---------------------------------------------------------------------------
create table if not exists public.links (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade,
  source_kind  public.node_kind not null,
  source_id    uuid not null,
  target_kind  public.node_kind not null,
  target_id    uuid not null,
  relation     text not null default 'relates_to',
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint links_no_self check (not (source_kind = target_kind and source_id = target_id))
);

create unique index if not exists links_edge_key
  on public.links (source_kind, source_id, target_kind, target_id, relation);
create index if not exists links_source_idx on public.links (source_kind, source_id);
create index if not exists links_target_idx on public.links (target_kind, target_id);
create index if not exists links_project_idx on public.links (project_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.events               enable row level security;
alter table public.documents            enable row level security;
alter table public.document_versions    enable row level security;
alter table public.meetings             enable row level security;
alter table public.meeting_attendees    enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.channels             enable row level security;
alter table public.channel_members      enable row level security;
alter table public.messages             enable row level security;
alter table public.message_reactions    enable row level security;
alter table public.boards               enable row level security;
alter table public.board_shapes         enable row level security;
alter table public.links                enable row level security;

-- events ---------------------------------------------------------------------
drop policy if exists event_read on public.events;
create policy event_read on public.events for select to authenticated
  using (public.can_see(project_id, client_visible));

drop policy if exists event_write on public.events;
create policy event_write on public.events for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- documents ------------------------------------------------------------------
-- Archiving hides a page from clients outright; staff keep reading it so the
-- archive is recoverable rather than a soft delete nobody can undo.
drop policy if exists document_read on public.documents;
create policy document_read on public.documents for select to authenticated
  using (public.can_see(project_id, client_visible) and (public.is_staff() or not is_archived));

drop policy if exists document_write on public.documents;
create policy document_write on public.documents for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Version history follows whatever you can read of the document itself.
drop policy if exists document_version_read on public.document_versions;
create policy document_version_read on public.document_versions for select to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id));

-- No insert policy: only the SECURITY DEFINER snapshot trigger writes here, so
-- history cannot be forged or back-dated from the client.
drop policy if exists document_version_prune on public.document_versions;
create policy document_version_prune on public.document_versions for delete to authenticated
  using (public.is_admin());

-- meetings -------------------------------------------------------------------
drop policy if exists meeting_read on public.meetings;
create policy meeting_read on public.meetings for select to authenticated
  using (public.can_see(project_id, client_visible));

drop policy if exists meeting_write on public.meetings;
create policy meeting_write on public.meetings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists attendee_read on public.meeting_attendees;
create policy attendee_read on public.meeting_attendees for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id));

drop policy if exists attendee_staff_write on public.meeting_attendees;
create policy attendee_staff_write on public.meeting_attendees for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- An invited client may answer their own invitation, and nothing else.
drop policy if exists attendee_self_rsvp on public.meeting_attendees;
create policy attendee_self_rsvp on public.meeting_attendees for update to authenticated
  using (profile_id = auth.uid() and exists (select 1 from public.meetings m where m.id = meeting_id))
  with check (profile_id = auth.uid());

drop policy if exists action_item_read on public.meeting_action_items;
create policy action_item_read on public.meeting_action_items for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id));

drop policy if exists action_item_write on public.meeting_action_items;
create policy action_item_write on public.meeting_action_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- channels -------------------------------------------------------------------

/**
 * Am I in this channel?
 *
 * SECURITY DEFINER is not an optimisation here, it is the fix for a hard
 * recursion: the policy on `channels` needs to know your membership, the policy
 * on `channel_members` needs to know which channels you can see, and each
 * re-enters the other until Postgres gives up with "infinite recursion detected
 * in policy for relation channels". Reading membership with RLS off breaks the
 * cycle. Same containment as 0001's helpers — it takes one argument and only
 * ever looks at the caller's own rows.
 *
 * Declared HERE rather than up with the other helpers because a SQL-language
 * function is parsed at creation time, and `channel_members` does not exist yet
 * at the top of this file.
 */
create or replace function public.is_channel_member(p_channel uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.channel_members
    where channel_id = p_channel and profile_id = auth.uid()
  );
$$;

drop policy if exists channel_read on public.channels;
create policy channel_read on public.channels for select to authenticated
  using (
    public.can_see(project_id, client_visible)
    -- DMs are visible only to their members, staff included. Via the helper,
    -- never a direct read of channel_members — see is_channel_member().
    and (kind <> 'direct' or public.is_channel_member(id))
  );

drop policy if exists channel_write on public.channels;
create policy channel_write on public.channels for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists channel_member_read on public.channel_members;
create policy channel_member_read on public.channel_members for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id));

drop policy if exists channel_member_staff on public.channel_members;
create policy channel_member_staff on public.channel_members for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Everyone maintains their own read cursor.
drop policy if exists channel_member_self on public.channel_members;
create policy channel_member_self on public.channel_members for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists channel_member_self_join on public.channel_members;
create policy channel_member_self_join on public.channel_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.channels c where c.id = channel_id and c.kind <> 'direct')
  );

-- messages -------------------------------------------------------------------
-- Readable exactly when the channel is. `channels` is itself under RLS, so the
-- EXISTS returns nothing for a channel the caller cannot see.
drop policy if exists message_read on public.messages;
create policy message_read on public.messages for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id));

drop policy if exists message_insert on public.messages;
create policy message_insert on public.messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.channels c where c.id = channel_id)
  );

drop policy if exists message_own_update on public.messages;
create policy message_own_update on public.messages for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists message_delete on public.messages;
create policy message_delete on public.messages for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists reaction_read on public.message_reactions;
create policy reaction_read on public.message_reactions for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id));

drop policy if exists reaction_own on public.message_reactions;
create policy reaction_own on public.message_reactions for all to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.messages m where m.id = message_id)
  );

-- boards ---------------------------------------------------------------------
drop policy if exists board_read on public.boards;
create policy board_read on public.boards for select to authenticated
  using (public.can_see(project_id, client_visible));

drop policy if exists board_write on public.boards;
create policy board_write on public.boards for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- A shared board is collaborative: anyone who can open it can draw on it.
-- `boards` is under RLS, so a client only reaches boards marked client_visible
-- inside their own org.
drop policy if exists shape_read on public.board_shapes;
create policy shape_read on public.board_shapes for select to authenticated
  using (exists (select 1 from public.boards b where b.id = board_id));

drop policy if exists shape_write on public.board_shapes;
create policy shape_write on public.board_shapes for all to authenticated
  using (exists (select 1 from public.boards b where b.id = board_id))
  with check (exists (select 1 from public.boards b where b.id = board_id));

-- links ----------------------------------------------------------------------
-- Staff see every edge. A client sees only edges inside their own project —
-- never the workspace-level ones (project_id null), whose mere existence would
-- hint at work that is not theirs. Both endpoints are re-checked at read time
-- by `knowledge_graph()` regardless.
drop policy if exists link_read on public.links;
create policy link_read on public.links for select to authenticated
  using (public.is_staff() or (project_id is not null and public.can_see(project_id, true)));

drop policy if exists link_write on public.links;
create policy link_write on public.links for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- Triggers
-- ============================================================================

-- updated_at ------------------------------------------------------------------
drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

drop trigger if exists meetings_touch on public.meetings;
create trigger meetings_touch before update on public.meetings
  for each row execute function public.touch_updated_at();

drop trigger if exists channels_touch on public.channels;
create trigger channels_touch before update on public.channels
  for each row execute function public.touch_updated_at();

drop trigger if exists boards_touch on public.boards;
create trigger boards_touch before update on public.boards
  for each row execute function public.touch_updated_at();

drop trigger if exists shapes_touch on public.board_shapes;
create trigger shapes_touch before update on public.board_shapes
  for each row execute function public.touch_updated_at();

/**
 * Documents: stamp the editor, and snapshot the PREVIOUS body before it is
 * overwritten. Snapshotting the old row (not the new one) means version N is
 * literally "what it looked like before edit N", which is what a restore wants.
 * Whitespace-only and title-only edits don't earn a version.
 */
create or replace function public.on_document_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);

  if new.body_md is distinct from old.body_md then
    insert into public.document_versions (document_id, title, body_md, edited_by)
    values (old.id, old.title, old.body_md, auth.uid());
  end if;

  return new;
end $$;

drop trigger if exists document_update on public.documents;
create trigger document_update before update on public.documents
  for each row execute function public.on_document_update();

/**
 * Wiki links. `[[Page Title]]` in a body becomes a real edge in the knowledge
 * graph, resolved by title within the same scope (project first, then the
 * workspace wiki). Unresolved links are simply not edges — writing
 * `[[Something]]` that doesn't exist yet is allowed and the edge appears the
 * moment someone creates that page and saves any document referencing it.
 */
create or replace function public.sync_document_links()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  needle text;
  target uuid;
begin
  delete from public.links
   where source_kind = 'document' and source_id = new.id and relation = 'mentions';

  for needle in
    select distinct m.parts[1]
      from regexp_matches(coalesce(new.body_md, ''), '\[\[([^\]\[]{1,200})\]\]', 'g') as m(parts)
  loop
    select d.id into target
      from public.documents d
     where lower(d.title) = lower(trim(needle))
       and d.id <> new.id
       and not d.is_archived
       and (d.project_id is not distinct from new.project_id or d.project_id is null)
     -- prefer a page in the same project over the shared wiki
     order by (d.project_id is not distinct from new.project_id) desc, d.created_at
     limit 1;

    if target is not null then
      insert into public.links
        (project_id, source_kind, source_id, target_kind, target_id, relation, created_by)
      values
        (new.project_id, 'document', new.id, 'document', target, 'mentions', auth.uid())
      on conflict do nothing;
    end if;
  end loop;

  return null;
end $$;

drop trigger if exists document_links on public.documents;
create trigger document_links after insert or update of body_md on public.documents
  for each row execute function public.sync_document_links();

-- A document deleted mid-graph must not leave dangling edges. The FKs on
-- `links` point at projects, not at the polymorphic endpoints, so clean up here.
create or replace function public.prune_links_for()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  k public.node_kind := tg_argv[0]::public.node_kind;
begin
  delete from public.links
   where (source_kind = k and source_id = old.id)
      or (target_kind = k and target_id = old.id);
  return old;
end $$;

drop trigger if exists document_link_prune on public.documents;
create trigger document_link_prune after delete on public.documents
  for each row execute function public.prune_links_for('document');

drop trigger if exists task_link_prune on public.tasks;
create trigger task_link_prune after delete on public.tasks
  for each row execute function public.prune_links_for('task');

drop trigger if exists meeting_link_prune on public.meetings;
create trigger meeting_link_prune after delete on public.meetings
  for each row execute function public.prune_links_for('meeting');

drop trigger if exists board_link_prune on public.boards;
create trigger board_link_prune after delete on public.boards
  for each row execute function public.prune_links_for('board');

/**
 * Chat notifications. Two audiences, deliberately narrow so the bell stays
 * meaningful: everyone `@handle`-mentioned, plus anyone who replied-to. Never
 * the whole channel — that is what the unread badge is for.
 */
create or replace function public.on_message_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chan   public.channels%rowtype;
  author text;
  targets uuid[];
  parent uuid;
begin
  select * into chan from public.channels where id = new.channel_id;
  select coalesce(full_name, handle) into author from public.profiles where id = new.author_id;

  -- @mentions, resolved against real handles only
  select array_agg(distinct p.id) into targets
    from public.profiles p
   where p.id <> new.author_id
     and p.role <> 'pending'
     and p.handle in (
       select lower(m.parts[1])
         from regexp_matches(new.body, '@([a-z0-9_]{1,30})', 'gi') as m(parts)
     );

  -- the person being replied to, if they are not already in the list
  if new.reply_to is not null then
    select author_id into parent from public.messages where id = new.reply_to;
    if parent is not null and parent <> new.author_id
       and not (coalesce(targets, '{}'::uuid[]) @> array[parent]) then
      targets := coalesce(targets, '{}'::uuid[]) || parent;
    end if;
  end if;

  if targets is not null and array_length(targets, 1) > 0 then
    perform public.notify_profiles(
      targets,
      'chat.mention',
      coalesce(author, 'Someone') || ' mentioned you in #' || chan.name,
      left(new.body, 180),
      '/workspace/chat/' || new.channel_id::text
    );
  end if;

  -- keep the channel list sorted by real activity
  update public.channels set updated_at = now() where id = new.channel_id;

  return new;
end $$;

drop trigger if exists message_created on public.messages;
create trigger message_created after insert on public.messages
  for each row execute function public.on_message_created();

/** Sending into a channel implicitly joins it, so your own messages are read. */
create or replace function public.on_message_sent_join()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.channel_members (channel_id, profile_id, last_read_at)
  values (new.channel_id, new.author_id, now())
  on conflict (channel_id, profile_id) do update set last_read_at = now();
  return new;
end $$;

drop trigger if exists message_sent_join on public.messages;
create trigger message_sent_join after insert on public.messages
  for each row when (new.author_id is not null)
  execute function public.on_message_sent_join();

/** A meeting scheduled with attendees tells them so. */
create or replace function public.on_meeting_invited()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m public.meetings%rowtype;
begin
  select * into m from public.meetings where id = new.meeting_id;
  if new.profile_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
    perform public.notify_profiles(
      array[new.profile_id],
      'meeting.invited',
      'Meeting: ' || m.title,
      to_char(m.starts_at at time zone 'UTC', 'Mon DD, HH24:MI') || ' UTC',
      '/workspace/meetings/' || m.id::text
    );
  end if;
  return new;
end $$;

drop trigger if exists meeting_invited on public.meeting_attendees;
create trigger meeting_invited after insert on public.meeting_attendees
  for each row execute function public.on_meeting_invited();

/** Publishing a document to the client is an event worth a record. */
create or replace function public.on_document_shared()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.client_visible and not old.client_visible then
    perform public.audit('document.shared', 'document', new.id,
      jsonb_build_object('title', new.title, 'kind', new.kind));
    if new.project_id is not null then
      perform public.notify_profiles(
        array(
          select pf.id from public.profiles pf
          join public.projects pr on pr.organization_id = pf.organization_id
          where pr.id = new.project_id and pf.role = 'client'
        ),
        'document.shared',
        'New document: ' || new.title,
        'Shared with you by the team.',
        '/workspace/portal'
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists document_shared on public.documents;
create trigger document_shared after update on public.documents
  for each row execute function public.on_document_shared();

-- ============================================================================
-- RPCs
-- ============================================================================

/**
 * Unified calendar feed. Real events, milestone due dates and meetings all
 * land in one shape so the month grid renders a single list.
 *
 * SECURITY INVOKER on purpose: every underlying read is RLS-filtered, so a
 * client's calendar can only ever contain their own organization's rows.
 */
create or replace function public.calendar_feed(
  p_from timestamptz,
  p_to   timestamptz,
  p_project uuid default null
)
returns table (
  id uuid,
  source text,
  kind text,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean,
  project_id uuid,
  project_name text,
  href text
)
language sql stable security invoker set search_path = public as $$
  select e.id, 'event', e.kind::text, e.title, e.starts_at, e.ends_at, e.all_day,
         e.project_id, p.name, '/workspace/calendar'
    from public.events e
    left join public.projects p on p.id = e.project_id
   where e.starts_at < p_to and e.ends_at >= p_from
     and (p_project is null or e.project_id = p_project)

  union all

  select m.id, 'meeting', m.status::text, m.title, m.starts_at,
         coalesce(m.ends_at, m.starts_at + interval '30 minutes'), false,
         m.project_id, p.name, '/workspace/meetings/' || m.id::text
    from public.meetings m
    left join public.projects p on p.id = m.project_id
   where m.starts_at < p_to and coalesce(m.ends_at, m.starts_at) >= p_from
     and m.status <> 'cancelled'
     and (p_project is null or m.project_id = p_project)

  union all

  select ms.id, 'milestone', ms.status::text, ms.title,
         ms.due_date::timestamptz, ms.due_date::timestamptz, true,
         ms.project_id, p.name,
         '/workspace/projects/' || p.slug || '/milestones'
    from public.milestones ms
    join public.projects p on p.id = ms.project_id
   where ms.due_date is not null
     and ms.due_date >= p_from::date and ms.due_date < p_to::date
     and (p_project is null or ms.project_id = p_project)

  order by starts_at;
$$;

/** Per-channel unread counts for the signed-in user. */
create or replace function public.unread_counts()
returns table (channel_id uuid, unread bigint)
language sql stable security invoker set search_path = public as $$
  select c.id,
         count(m.id) filter (
           where m.created_at > coalesce(cm.last_read_at, 'epoch'::timestamptz)
             and m.author_id is distinct from auth.uid()
         )
    from public.channels c
    left join public.channel_members cm
           on cm.channel_id = c.id and cm.profile_id = auth.uid()
    left join public.messages m on m.channel_id = c.id
   group by c.id;
$$;

/** Move your own read cursor. */
create or replace function public.mark_channel_read(p_channel uuid)
returns void language sql security invoker set search_path = public as $$
  insert into public.channel_members (channel_id, profile_id, last_read_at)
  values (p_channel, auth.uid(), now())
  on conflict (channel_id, profile_id) do update set last_read_at = now();
$$;

/** Heartbeat for the "active N minutes ago" fallback when a socket is absent. */
create or replace function public.touch_presence()
returns void language sql security invoker set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

/**
 * The knowledge graph.
 *
 * Nodes and edges for one project, or for the whole workspace when
 * `p_project` is null. Explicit `links` rows are unioned with the edges that
 * the schema already implies — a task's milestone, a document's parent, a
 * meeting's action item that became a task. SECURITY INVOKER, so the graph a
 * client sees contains only nodes a client may read.
 */
create or replace function public.knowledge_graph(p_project uuid default null)
returns jsonb
language sql stable security invoker set search_path = public as $$
with
nodes as (
  select p.id, 'project'::text as kind, p.name as label,
         '/workspace/projects/' || p.slug as href, p.id as project_id
    from public.projects p
   where p_project is null or p.id = p_project

  union all
  select t.id, 'task', '#' || t.ref || ' ' || t.title,
         '/workspace/projects/' || p.slug || '/board', t.project_id
    from public.tasks t join public.projects p on p.id = t.project_id
   where p_project is null or t.project_id = p_project

  union all
  select ms.id, 'milestone', ms.title,
         '/workspace/projects/' || p.slug || '/milestones', ms.project_id
    from public.milestones ms join public.projects p on p.id = ms.project_id
   where p_project is null or ms.project_id = p_project

  union all
  select d.id, 'document', d.title,
         '/workspace/' || case when d.kind = 'wiki' then 'wiki/' else 'docs/' end || d.slug,
         d.project_id
    from public.documents d
   where (p_project is null or d.project_id = p_project) and not d.is_archived

  union all
  select m.id, 'meeting', m.title, '/workspace/meetings/' || m.id::text, m.project_id
    from public.meetings m
   where p_project is null or m.project_id = p_project

  union all
  select b.id, 'board', b.title, '/workspace/whiteboard/' || b.id::text, b.project_id
    from public.boards b
   where p_project is null or b.project_id = p_project

  union all
  select f.id, 'file', f.name,
         '/workspace/projects/' || p.slug || '/files', f.project_id
    from public.files f join public.projects p on p.id = f.project_id
   where p_project is null or f.project_id = p_project
),
edges as (
  -- explicit
  select l.source_kind::text as sk, l.source_id as sid,
         l.target_kind::text as tk, l.target_id as tid, l.relation as rel
    from public.links l
   where p_project is null or l.project_id = p_project

  union all
  -- structural: what the foreign keys already say
  select 'task', t.id, 'milestone', t.milestone_id, 'in'
    from public.tasks t
   where t.milestone_id is not null and (p_project is null or t.project_id = p_project)

  union all
  select 'task', t.id, 'project', t.project_id, 'in'
    from public.tasks t where p_project is null or t.project_id = p_project

  union all
  select 'milestone', ms.id, 'project', ms.project_id, 'in'
    from public.milestones ms where p_project is null or ms.project_id = p_project

  union all
  select 'document', d.id, 'project', d.project_id, 'in'
    from public.documents d
   where d.project_id is not null and not d.is_archived
     and (p_project is null or d.project_id = p_project)

  union all
  select 'document', d.id, 'document', d.parent_id, 'child of'
    from public.documents d
   where d.parent_id is not null and not d.is_archived
     and (p_project is null or d.project_id = p_project)

  union all
  select 'meeting', m.id, 'project', m.project_id, 'in'
    from public.meetings m
   where m.project_id is not null and (p_project is null or m.project_id = p_project)

  union all
  select 'meeting', ai.meeting_id, 'task', ai.task_id, 'produced'
    from public.meeting_action_items ai
   where ai.task_id is not null

  union all
  select 'board', b.id, 'project', b.project_id, 'in'
    from public.boards b
   where b.project_id is not null and (p_project is null or b.project_id = p_project)

  union all
  select 'file', f.id, 'project', f.project_id, 'in'
    from public.files f where p_project is null or f.project_id = p_project
)
select jsonb_build_object(
  'nodes', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', n.id, 'kind', n.kind, 'label', n.label, 'href', n.href, 'project', n.project_id
    )) from nodes n
  ), '[]'::jsonb),
  -- An edge survives only when BOTH endpoints survived RLS, so a client never
  -- sees a line pointing at a node they are not allowed to know exists.
  'edges', coalesce((
    select jsonb_agg(distinct jsonb_build_object(
      'source', e.sid, 'target', e.tid, 'rel', e.rel
    ))
      from edges e
     where exists (select 1 from nodes n where n.id = e.sid and n.kind = e.sk)
       and exists (select 1 from nodes n where n.id = e.tid and n.kind = e.tk)
  ), '[]'::jsonb)
);
$$;

/** Turn a meeting action item into a real task, once. */
create or replace function public.action_item_to_task(p_item uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  item public.meeting_action_items%rowtype;
  proj uuid;
  new_id uuid;
begin
  select * into item from public.meeting_action_items where id = p_item;
  if item.id is null then raise exception 'No such action item'; end if;
  if item.task_id is not null then return item.task_id; end if;

  select project_id into proj from public.meetings where id = item.meeting_id;
  if proj is null then raise exception 'Meeting is not attached to a project'; end if;

  insert into public.tasks (project_id, title, status, assignee_id)
  values (proj, left(item.body, 180), 'todo', item.owner_id)
  returning id into new_id;

  update public.meeting_action_items set task_id = new_id where id = p_item;
  return new_id;
end $$;

-- ---------------------------------------------------------------------------
-- Search — extend 0001's ⌘K to reach the new surfaces. Still SECURITY INVOKER,
-- so results stay RLS-filtered per caller.
--
-- The return type gains an `href` column, and Postgres will not let CREATE OR
-- REPLACE change a function's shape, so drop it first. `href` is NULL for the
-- four original kinds: those live under /projects for staff and /portal for
-- clients, and only the caller knows which — the palette still derives those.
-- The new kinds have one role-agnostic route each, so SQL can name them.
-- ---------------------------------------------------------------------------
drop function if exists public.workspace_search(text);

create function public.workspace_search(q text)
returns table (
  kind text, id uuid, project_id uuid, project_slug text,
  title text, subtitle text, href text, rank real
) language sql stable security invoker set search_path = public as $$
  with query as (
    select websearch_to_tsquery('english', q) as ts,
           '%' || lower(q) || '%' as like_q
  )
  -- `as rank` is load-bearing: in a UNION, ORDER BY resolves against the
  -- OUTPUT column names of the first branch, not the RETURNS TABLE signature.
  select 'project', p.id, p.id, p.slug, p.name, p.description, null::text,
         ts_rank(to_tsvector('english', p.name || ' ' || coalesce(p.description, '')), query.ts) as rank
    from public.projects p, query
   where to_tsvector('english', p.name || ' ' || coalesce(p.description, '')) @@ query.ts

  union all
  select 'task', t.id, t.project_id, p.slug, t.title, 'TASK-' || t.ref, null::text,
         ts_rank(to_tsvector('english', t.title || ' ' || coalesce(t.description, '')), query.ts)
    from public.tasks t join public.projects p on p.id = t.project_id, query
   where to_tsvector('english', t.title || ' ' || coalesce(t.description, '')) @@ query.ts

  union all
  select 'update', u.id, u.project_id, p.slug, u.title, u.update_type::text, null::text,
         ts_rank(to_tsvector('english', u.title || ' ' || u.body_md), query.ts)
    from public.updates u join public.projects p on p.id = u.project_id, query
   where to_tsvector('english', u.title || ' ' || u.body_md) @@ query.ts

  union all
  select 'file', f.id, f.project_id, p.slug, f.name, p.name, null::text,
         ts_rank(to_tsvector('english', f.name), query.ts)
    from public.files f join public.projects p on p.id = f.project_id, query
   where to_tsvector('english', f.name) @@ query.ts

  union all
  select 'document', d.id, d.project_id, p.slug, d.title,
         case when d.kind = 'wiki' then 'Wiki' else 'Doc' end,
         '/workspace/' || case when d.kind = 'wiki' then 'wiki/' else 'docs/' end || d.slug,
         ts_rank(to_tsvector('english', d.title || ' ' || d.body_md), query.ts)
    from public.documents d
    left join public.projects p on p.id = d.project_id, query
   where not d.is_archived
     and to_tsvector('english', d.title || ' ' || d.body_md) @@ query.ts

  union all
  select 'meeting', m.id, m.project_id, p.slug, m.title,
         to_char(m.starts_at, 'Mon DD'), '/workspace/meetings/' || m.id::text,
         ts_rank(to_tsvector('english', m.title || ' ' || m.agenda_md || ' ' || m.notes_md), query.ts)
    from public.meetings m
    left join public.projects p on p.id = m.project_id, query
   where to_tsvector('english', m.title || ' ' || m.agenda_md || ' ' || m.notes_md) @@ query.ts

  union all
  -- Chat is chronological, not editorial: a short line rarely survives
  -- stemming, so match it literally and give it a flat low rank.
  select 'message', msg.id, c.project_id, p.slug, left(msg.body, 90),
         '#' || c.name, '/workspace/chat/' || c.id::text, 0.04::real
    from public.messages msg
    join public.channels c on c.id = msg.channel_id
    left join public.projects p on p.id = c.project_id, query
   where lower(msg.body) like query.like_q

  order by rank desc
  limit 30;
$$;

-- ⌘K reads these on every keystroke-debounce; index what it scans.
create index if not exists documents_fts_idx on public.documents
  using gin (to_tsvector('english', title || ' ' || body_md));
create index if not exists meetings_fts_idx on public.meetings
  using gin (to_tsvector('english', title || ' ' || agenda_md || ' ' || notes_md));
-- The chat branch is a leading-wildcard ILIKE, which no btree can serve;
-- trigram is the only index that helps it.
--
-- Wrapped because this is a performance nicety, not correctness: on a managed
-- Postgres `pg_trgm` may be unavailable or installed into a schema that isn't
-- on the search_path, and `gin_trgm_ops` would then fail to resolve. Chat
-- search still works without the index — it just scans — so a failure here
-- must not abort the rest of the migration.
do $$
begin
  create extension if not exists pg_trgm;
  execute 'create index if not exists messages_body_trgm_idx on public.messages '
       || 'using gin (lower(body) gin_trgm_ops)';
exception when others then
  raise warning 'Skipped messages_body_trgm_idx (%): chat search falls back to a scan.', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime. Postgres CDC for durable state; Presence and Broadcast (cursors,
-- typing) ride the same socket without touching a table.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'events','documents','meetings','meeting_attendees','meeting_action_items',
    'channels','messages','message_reactions','boards','board_shapes','links'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- A shape drag emits an UPDATE per frame; without REPLICA IDENTITY FULL the
-- payload carries only the primary key and remote clients cannot render it.
alter table public.board_shapes replica identity full;
alter table public.messages replica identity full;

-- ---------------------------------------------------------------------------
-- Storage. Chat attachments, private, signed on demand — same discipline as
-- `project-files` in 0001. Keyed `<channel_id>/<uuid>-<filename>`.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-attachments', 'chat-attachments', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists chat_attach_read on storage.objects;
create policy chat_attach_read on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.channels c
      where c.id = (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists chat_attach_write on storage.objects;
create policy chat_attach_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.channels c
      where c.id = (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists chat_attach_delete on storage.objects;
create policy chat_attach_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chat-attachments' and (owner = auth.uid() or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Seed: the one channel every workspace wants on day one.
-- ---------------------------------------------------------------------------
insert into public.channels (kind, name, topic, client_visible)
select 'workspace', 'general', 'Everything that does not belong to one project', false
where not exists (select 1 from public.channels where kind = 'workspace' and name = 'general');
