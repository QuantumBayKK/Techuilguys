-- ============================================================================
-- Test harness — minimal stand-ins for the parts of a Supabase project that
-- the migrations lean on, so both can be applied to a bare Postgres and
-- exercised. NEVER run this against a real Supabase project: it would shadow
-- the genuine auth/storage schemas.
--
-- Not an emulator. Just the surface `0001` and `0002` actually touch.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role anon;          exception when duplicate_object then null; end $$;
do $$ begin create role service_role;  exception when duplicate_object then null; end $$;

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

/**
 * Supabase derives this from the JWT. Here it reads a session GUC, so a test
 * can impersonate anyone with `select set_config('request.jwt.claim.sub', …)`.
 */
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id              text primary key,
  name            text not null,
  public          boolean not null default false,
  file_size_limit bigint
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets(id),
  name       text not null,
  owner      uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/');
$$;

do $$ begin
  create publication supabase_realtime;
exception when duplicate_object then null; end $$;

-- Supabase grants these to `authenticated` out of the box; without them RLS
-- would never even be reached — the role would fail on permission first, and
-- the isolation tests would pass for entirely the wrong reason.
grant usage on schema public to authenticated, anon, service_role;
alter default privileges in schema public
  grant all on tables to authenticated;
alter default privileges in schema public
  grant all on sequences to authenticated;
