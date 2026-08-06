-- ============================================================================
-- TechuilaGuys Workspace — schema, RLS, triggers, RPCs, storage.
--
-- Run once in the Supabase SQL editor (or `supabase db push`). Idempotent
-- enough to re-run on a fresh project; not a substitute for real migrations
-- once you have production data.
--
-- The multi-tenancy guarantee lives HERE, not in React. Every "clients see only
-- their own project" rule is a Postgres policy. A bug in the UI cannot leak
-- Client A's data to Client B.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin','employee','client','pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('discovery','building','review','launched','paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.health_level as enum ('green','amber','red');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.milestone_status as enum ('pending','in_progress','done','approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('backlog','todo','in_progress','review','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low','med','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.update_type as enum ('progress','launch','blocker','note');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_parent as enum ('project','task','update','milestone');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_type as enum ('new_project','change','bug','question');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('new','reviewing','accepted','rejected','done');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text,
  avatar_url            text,
  role                  public.user_role not null default 'pending',
  organization_id       uuid references public.organizations(id) on delete set null,
  weekly_capacity_hours int not null default 30,
  created_at            timestamptz not null default now()
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status          public.project_status not null default 'discovery',
  health          public.health_level not null default 'green',
  health_note     text,
  progress_pct    int not null default 0 check (progress_pct between 0 and 100),
  start_date      date,
  target_date     date,
  github_repo     text,     -- "owner/name"
  notion_page_id  text,
  created_at      timestamptz not null default now()
);
create index if not exists projects_org_idx on public.projects(organization_id);

create table if not exists public.project_members (
  project_id      uuid not null references public.projects(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  role_on_project text,
  primary key (project_id, profile_id)
);

create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  order_index int not null default 0,
  status      public.milestone_status not null default 'pending',
  due_date    date,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists milestones_project_idx on public.milestones(project_id, order_index);

create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  ref            bigint generated always as identity,  -- the #TASK-123 handle
  project_id     uuid not null references public.projects(id) on delete cascade,
  milestone_id   uuid references public.milestones(id) on delete set null,
  title          text not null,
  description    text,
  status         public.task_status not null default 'backlog',
  assignee_id    uuid references public.profiles(id) on delete set null,
  priority       public.task_priority not null default 'med',
  client_visible boolean not null default true,
  order_index    int not null default 0,
  due_date       date,
  created_at     timestamptz not null default now()
);
create unique index if not exists tasks_ref_key on public.tasks(ref);
create index if not exists tasks_project_idx on public.tasks(project_id, status, order_index);

create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null,
  body_md     text not null default '',
  update_type public.update_type not null default 'progress',
  created_at  timestamptz not null default now()
);
create index if not exists updates_project_idx on public.updates(project_id, created_at desc);

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  parent_type   public.comment_parent not null,
  parent_id     uuid not null,
  author_id     uuid references public.profiles(id) on delete set null,
  body_md       text not null,
  internal_only boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists comments_parent_idx on public.comments(parent_type, parent_id, created_at);

create table if not exists public.files (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  uploader_id    uuid references public.profiles(id) on delete set null,
  name           text not null,
  storage_path   text not null unique,
  size_bytes     bigint not null,
  mime_type      text,
  client_visible boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists files_project_idx on public.files(project_id, created_at desc);

create table if not exists public.time_logs (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete set null,
  project_id  uuid not null references public.projects(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  minutes     int not null check (minutes > 0),
  logged_date date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists time_logs_person_idx on public.time_logs(profile_id, logged_date desc);

create table if not exists public.requests (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submitted_by    uuid references public.profiles(id) on delete set null,
  title           text not null,
  description     text not null,
  request_type    public.request_type not null default 'change',
  status          public.request_status not null default 'new',
  created_at      timestamptz not null default now()
);
create index if not exists requests_org_idx on public.requests(organization_id, created_at desc);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_inbox_idx on public.notifications(profile_id, read, created_at desc);

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_time_idx on public.audit_log(created_at desc);

-- ---------------------------------------------------------------------------
-- Identity helpers.
--
-- SECURITY DEFINER on purpose: these read `profiles`, and `profiles` itself has
-- RLS that calls them. Definer rights break that recursion. They take no
-- arguments and only ever read the *caller's own* row, so they cannot be abused
-- as a data-exfiltration primitive.
-- ---------------------------------------------------------------------------
create or replace function public.current_role_of()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role::text from public.profiles where id = auth.uid()), 'pending');
$$;

create or replace function public.current_org_of()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_of() in ('admin','employee');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_of() = 'admin';
$$;

/** True when the caller may see the project at all (staff, or client of its org). */
create or replace function public.can_read_project(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
      or exists (
        select 1 from public.projects pr
        where pr.id = p and pr.organization_id = public.current_org_of()
      );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations   enable row level security;
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.milestones      enable row level security;
alter table public.tasks           enable row level security;
alter table public.updates         enable row level security;
alter table public.comments        enable row level security;
alter table public.files           enable row level security;
alter table public.time_logs       enable row level security;
alter table public.requests        enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_log       enable row level security;

-- organizations -------------------------------------------------------------
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations for select to authenticated
  using (public.is_staff() or id = public.current_org_of());

drop policy if exists org_write on public.organizations;
create policy org_write on public.organizations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles ------------------------------------------------------------------
-- Clients can see staff (needed for "who's on my project" avatars) and their own
-- org's people. They cannot see other clients.
drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_staff()
    or role in ('admin','employee')
    or (organization_id is not null and organization_id = public.current_org_of())
  );

drop policy if exists profile_self_update on public.profiles;
create policy profile_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profile_admin_write on public.profiles;
create policy profile_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Self-update must not be a privilege-escalation path: a non-admin editing
-- their own row silently keeps their existing role and organization.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.organization_id := old.organization_id;
    new.weekly_capacity_hours := old.weekly_capacity_hours;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- projects ------------------------------------------------------------------
drop policy if exists project_read on public.projects;
create policy project_read on public.projects for select to authenticated
  using (public.is_staff() or organization_id = public.current_org_of());

-- Employees run the day-to-day (status, health, links); only admins may create
-- or delete a project.
drop policy if exists project_staff_update on public.projects;
create policy project_staff_update on public.projects for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists project_admin_insert on public.projects;
create policy project_admin_insert on public.projects for insert to authenticated
  with check (public.is_admin());

drop policy if exists project_admin_delete on public.projects;
create policy project_admin_delete on public.projects for delete to authenticated
  using (public.is_admin());

-- project_members -----------------------------------------------------------
drop policy if exists member_read on public.project_members;
create policy member_read on public.project_members for select to authenticated
  using (public.can_read_project(project_id));

drop policy if exists member_write on public.project_members;
create policy member_write on public.project_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- milestones ----------------------------------------------------------------
drop policy if exists milestone_read on public.milestones;
create policy milestone_read on public.milestones for select to authenticated
  using (public.can_read_project(project_id));

drop policy if exists milestone_write on public.milestones;
create policy milestone_write on public.milestones for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- tasks ---------------------------------------------------------------------
-- The client_visible toggle is what keeps internal chores off the client board.
drop policy if exists task_read on public.tasks;
create policy task_read on public.tasks for select to authenticated
  using (
    public.is_staff()
    or (client_visible and exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.organization_id = public.current_org_of()
    ))
  );

drop policy if exists task_write on public.tasks;
create policy task_write on public.tasks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- updates -------------------------------------------------------------------
drop policy if exists update_read on public.updates;
create policy update_read on public.updates for select to authenticated
  using (public.can_read_project(project_id));

drop policy if exists update_write on public.updates;
create policy update_write on public.updates for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- comments ------------------------------------------------------------------
drop policy if exists comment_read on public.comments;
create policy comment_read on public.comments for select to authenticated
  using (
    public.is_staff()
    or (internal_only = false and public.can_read_project(project_id))
  );

drop policy if exists comment_insert on public.comments;
create policy comment_insert on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_read_project(project_id)
    and (public.is_staff() or internal_only = false)
  );

drop policy if exists comment_own_write on public.comments;
create policy comment_own_write on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists comment_delete on public.comments;
create policy comment_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- files ---------------------------------------------------------------------
drop policy if exists file_read on public.files;
create policy file_read on public.files for select to authenticated
  using (
    public.is_staff()
    or (client_visible and exists (
      select 1 from public.projects p
      where p.id = files.project_id and p.organization_id = public.current_org_of()
    ))
  );

-- Clients may upload, but only into their own org's projects, and never as a
-- hidden file (nothing a client uploads should be invisible to them).
drop policy if exists file_insert on public.files;
create policy file_insert on public.files for insert to authenticated
  with check (
    uploader_id = auth.uid()
    and public.can_read_project(project_id)
    and (public.is_staff() or client_visible = true)
  );

drop policy if exists file_update on public.files;
create policy file_update on public.files for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists file_delete on public.files;
create policy file_delete on public.files for delete to authenticated
  using (uploader_id = auth.uid() or public.is_admin());

-- time_logs -----------------------------------------------------------------
-- Clients get nothing at all here. Employees see only their own rows.
drop policy if exists timelog_read on public.time_logs;
create policy timelog_read on public.time_logs for select to authenticated
  using (public.is_admin() or (public.is_staff() and profile_id = auth.uid()));

drop policy if exists timelog_write on public.time_logs;
create policy timelog_write on public.time_logs for all to authenticated
  using (public.is_admin() or (public.is_staff() and profile_id = auth.uid()))
  with check (public.is_admin() or (public.is_staff() and profile_id = auth.uid()));

-- requests ------------------------------------------------------------------
drop policy if exists request_read on public.requests;
create policy request_read on public.requests for select to authenticated
  using (public.is_staff() or organization_id = public.current_org_of());

drop policy if exists request_insert on public.requests;
create policy request_insert on public.requests for insert to authenticated
  with check (public.is_staff() or organization_id = public.current_org_of());

drop policy if exists request_staff_update on public.requests;
create policy request_staff_update on public.requests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists request_delete on public.requests;
create policy request_delete on public.requests for delete to authenticated
  using (public.is_admin());

-- notifications -------------------------------------------------------------
drop policy if exists notif_own on public.notifications;
create policy notif_own on public.notifications for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists notif_own_update on public.notifications;
create policy notif_own_update on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists notif_own_delete on public.notifications;
create policy notif_own_delete on public.notifications for delete to authenticated
  using (profile_id = auth.uid());

-- audit_log -----------------------------------------------------------------
-- Read-only, admin-only, insert-only-by-trigger. No insert policy exists, so
-- clients of any role cannot forge entries; the triggers are SECURITY DEFINER.
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Signup → profile. First account ever created becomes the admin, otherwise the
-- user lands in `pending` and sees the holding screen until an admin acts.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  seeded boolean;
begin
  select exists (select 1 from public.profiles) into seeded;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    case when seeded then 'pending'::public.user_role else 'admin'::public.user_role end
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- progress_pct is derived, never typed in.
-- ---------------------------------------------------------------------------
create or replace function public.recalc_project_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.project_id, old.project_id);
begin
  update public.projects p
  set progress_pct = coalesce((
    select round(100.0 * count(*) filter (where m.status in ('done','approved')) / nullif(count(*), 0))
    from public.milestones m where m.project_id = pid
  ), 0)
  where p.id = pid;
  return coalesce(new, old);
end $$;

drop trigger if exists milestone_progress on public.milestones;
create trigger milestone_progress after insert or update or delete on public.milestones
  for each row execute function public.recalc_project_progress();

-- ---------------------------------------------------------------------------
-- Notifications + audit. Deliberately narrow: the four events worth a record.
-- ---------------------------------------------------------------------------
create or replace function public.notify_profiles(
  p_ids uuid[], p_type text, p_title text, p_body text, p_link text
) returns void language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, title, body, link)
  select unnest(p_ids), p_type, p_title, p_body, p_link;
$$;

create or replace function public.audit(
  p_action text, p_entity text, p_id uuid, p_meta jsonb
) returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_id, p_meta);
$$;

create or replace function public.on_milestone_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  proj public.projects%rowtype;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select * into proj from public.projects where id = new.project_id;
    perform public.audit('milestone.approved', 'milestone', new.id,
      jsonb_build_object('title', new.title, 'project', proj.name));
    perform public.notify_profiles(
      array(select id from public.profiles where role in ('admin','employee')),
      'milestone.approved',
      'Milestone approved: ' || new.title,
      proj.name || ' — the client signed off.',
      '/workspace/projects/' || proj.slug || '/milestones'
    );
  end if;
  return new;
end $$;

drop trigger if exists milestone_approved on public.milestones;
create trigger milestone_approved after update on public.milestones
  for each row execute function public.on_milestone_change();

create or replace function public.on_request_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_profiles(
    array(select id from public.profiles where role in ('admin','employee')),
    'request.new',
    'New client request: ' || new.title,
    new.description,
    '/workspace/requests'
  );
  return new;
end $$;

drop trigger if exists request_created on public.requests;
create trigger request_created after insert on public.requests
  for each row execute function public.on_request_created();

-- A client-facing update should ping the client, not the team that wrote it.
create or replace function public.on_update_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  proj public.projects%rowtype;
begin
  select * into proj from public.projects where id = new.project_id;
  perform public.notify_profiles(
    array(
      select id from public.profiles
      where role = 'client' and organization_id = proj.organization_id
    ),
    'update.posted',
    new.title,
    proj.name || ' — new update from the team.',
    '/workspace/portal/' || proj.slug || '/updates'
  );
  return new;
end $$;

drop trigger if exists update_created on public.updates;
create trigger update_created after insert on public.updates
  for each row execute function public.on_update_created();

create or replace function public.on_project_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform public.audit('project.status', 'project', new.id,
      jsonb_build_object('from', old.status, 'to', new.status, 'name', new.name));
  end if;
  return new;
end $$;

drop trigger if exists project_status_audit on public.projects;
create trigger project_status_audit after update on public.projects
  for each row execute function public.on_project_status_change();

create or replace function public.on_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role or new.organization_id is distinct from old.organization_id then
    perform public.audit('profile.role', 'profile', new.id,
      jsonb_build_object('email', new.email, 'from', old.role, 'to', new.role,
                         'organization_id', new.organization_id));
    if new.role <> 'pending' and old.role = 'pending' then
      perform public.notify_profiles(array[new.id], 'access.granted',
        'You''re in.', 'Your TechuilaGuys workspace access has been approved.',
        '/workspace');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profile_role_audit on public.profiles;
create trigger profile_role_audit after update on public.profiles
  for each row execute function public.on_role_change();

create or replace function public.on_file_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.audit('file.deleted', 'file', old.id,
    jsonb_build_object('name', old.name, 'project_id', old.project_id));
  return old;
end $$;

drop trigger if exists file_delete_audit on public.files;
create trigger file_delete_audit after delete on public.files
  for each row execute function public.on_file_deleted();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

/**
 * Milestone approval. Admins and the owning org's clients may approve; the
 * definer rights exist so a *client* (who has no write policy on milestones)
 * can still flip exactly this one field and nothing else.
 */
create or replace function public.approve_milestone(p_milestone uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  proj_org uuid;
begin
  select p.organization_id into proj_org
  from public.milestones m join public.projects p on p.id = m.project_id
  where m.id = p_milestone;

  if proj_org is null then
    raise exception 'milestone not found';
  end if;

  if not (public.is_admin() or proj_org = public.current_org_of()) then
    raise exception 'not permitted to approve this milestone';
  end if;

  update public.milestones
  set status = 'approved', approved_by = auth.uid(), approved_at = now()
  where id = p_milestone and status = 'done';

  if not found then
    raise exception 'milestone is not ready for approval';
  end if;
end $$;

/** Persist a drag-drop reorder in one round trip. RLS still applies (invoker). */
create or replace function public.reorder_tasks(p_ids uuid[], p_status public.task_status)
returns void language sql security invoker set search_path = public as $$
  update public.tasks t
  set order_index = pos.idx, status = p_status
  from (select id, ordinality::int as idx from unnest(p_ids) with ordinality as u(id, ordinality)) pos
  where t.id = pos.id;
$$;

/** GitHub commit hook: `#TASK-123` in a message moves task 123 to Review. */
create or replace function public.advance_task_by_ref(p_ref bigint)
returns void language sql security invoker set search_path = public as $$
  update public.tasks set status = 'review'
  where ref = p_ref and status not in ('review','done');
$$;

-- Full-text search, invoker rights so RLS filters the result set for free:
-- a client literally cannot get a hit on another org's project.
create index if not exists projects_fts_idx on public.projects
  using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));
create index if not exists tasks_fts_idx on public.tasks
  using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));
create index if not exists updates_fts_idx on public.updates
  using gin (to_tsvector('english', title || ' ' || coalesce(body_md, '')));
create index if not exists files_fts_idx on public.files
  using gin (to_tsvector('english', name));

-- Dropped rather than replaced: 0002 widens this function's return type, and
-- CREATE OR REPLACE cannot change a signature — so without the drop, re-running
-- THIS file on a database that already has 0002 aborts the whole script.
-- (Doing so does roll the function back to the narrower shape here; re-run
-- 0002 afterwards to restore the newer columns.)
drop function if exists public.workspace_search(text);

create function public.workspace_search(q text)
returns table (
  kind text, id uuid, project_id uuid, project_slug text,
  title text, subtitle text, rank real
) language sql stable security invoker set search_path = public as $$
  with query as (select websearch_to_tsquery('english', q) as ts)
  -- `as rank` is load-bearing: in a UNION, ORDER BY resolves against the
  -- OUTPUT column names of the first branch, not the RETURNS TABLE signature.
  -- Unaliased, that column is called `ts_rank` and `order by rank` fails to
  -- compile the whole function.
  select 'project', p.id, p.id, p.slug, p.name, p.description,
         ts_rank(to_tsvector('english', p.name || ' ' || coalesce(p.description,'')), query.ts) as rank
  from public.projects p, query
  where to_tsvector('english', p.name || ' ' || coalesce(p.description,'')) @@ query.ts
  union all
  select 'task', t.id, t.project_id, p.slug, t.title, 'TASK-' || t.ref,
         ts_rank(to_tsvector('english', t.title || ' ' || coalesce(t.description,'')), query.ts)
  from public.tasks t join public.projects p on p.id = t.project_id, query
  where to_tsvector('english', t.title || ' ' || coalesce(t.description,'')) @@ query.ts
  union all
  select 'update', u.id, u.project_id, p.slug, u.title, u.update_type::text,
         ts_rank(to_tsvector('english', u.title || ' ' || coalesce(u.body_md,'')), query.ts)
  from public.updates u join public.projects p on p.id = u.project_id, query
  where to_tsvector('english', u.title || ' ' || coalesce(u.body_md,'')) @@ query.ts
  union all
  select 'file', f.id, f.project_id, p.slug, f.name, f.mime_type,
         ts_rank(to_tsvector('english', f.name), query.ts)
  from public.files f join public.projects p on p.id = f.project_id, query
  where to_tsvector('english', f.name) @@ query.ts
  order by rank desc
  limit 20;
$$;

-- ---------------------------------------------------------------------------
-- Realtime — two devs watching the same board see each other move cards.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tasks','comments','updates','milestones','notifications','requests'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage. Private bucket; the app hands out short-lived signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists project_files_read on storage.objects;
create policy project_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files' and (
      public.is_staff()
      or exists (
        select 1 from public.files f
        join public.projects p on p.id = f.project_id
        where f.storage_path = storage.objects.name
          and f.client_visible
          and p.organization_id = public.current_org_of()
      )
    )
  );

-- Objects are keyed `<project_id>/<uuid>-<filename>`, so the first path segment
-- is what we authorize against.
drop policy if exists project_files_write on storage.objects;
create policy project_files_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and public.can_read_project((storage.foldername(name))[1]::uuid)
  );

drop policy if exists project_files_delete on storage.objects;
create policy project_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and (owner = auth.uid() or public.is_admin()));
