-- ============================================================================
-- Seed. Two organizations that must never see each other, plus enough content
-- to exercise every trigger and RPC added in 0002.
--
-- Runs as the table owner, so RLS is bypassed here on purpose — this is the
-- fixture, not the test. `02_assert.sql` does the work under `authenticated`.
-- ============================================================================

grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- The very first account becomes admin (0001's handle_new_user).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@techuila.test',
   '{"full_name":"Ada Admin"}'::jsonb);

-- Everything after lands in `pending` and must be promoted by an admin, so
-- impersonate the admin for the rest of the fixture — `guard_profile_privileges`
-- silently reverts a role change made by anyone else.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'emp@techuila.test',    '{"full_name":"Eli Employee"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c1', 'ann@orga.test',        '{"full_name":"Ann OrgA"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c2', 'bob@orgb.test',        '{"full_name":"Bob OrgB"}'::jsonb);

insert into public.organizations (id, name) values
  ('00000000-0000-0000-0000-00000000a000', 'Org A'),
  ('00000000-0000-0000-0000-00000000b000', 'Org B');

update public.profiles set role = 'employee'
 where id = '00000000-0000-0000-0000-0000000000e1';
update public.profiles set role = 'client', organization_id = '00000000-0000-0000-0000-00000000a000'
 where id = '00000000-0000-0000-0000-0000000000c1';
update public.profiles set role = 'client', organization_id = '00000000-0000-0000-0000-00000000b000'
 where id = '00000000-0000-0000-0000-0000000000c2';

insert into public.projects (id, name, slug, organization_id, description) values
  ('00000000-0000-0000-0000-00000000a001', 'Alpha Build', 'alpha-build',
   '00000000-0000-0000-0000-00000000a000', 'Org A secret roadmap'),
  ('00000000-0000-0000-0000-00000000b001', 'Bravo Build', 'bravo-build',
   '00000000-0000-0000-0000-00000000b000', 'Org B secret roadmap');

insert into public.milestones (id, project_id, title, due_date, order_index) values
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-00000000a001',
   'Alpha launch', current_date + 7, 0);

insert into public.tasks (id, project_id, milestone_id, title) values
  ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-00000000a001',
   '00000000-0000-0000-0000-00000000a002', 'Wire the sender flow');

-- Documents -------------------------------------------------------------------
-- "Runbook" links to "Architecture" with [[…]], which the sync trigger must
-- turn into a real edge.
insert into public.documents (id, kind, title, slug, body_md, client_visible) values
  ('00000000-0000-0000-0000-00000000d001', 'wiki', 'Architecture', 'architecture',
   'How the thing is built.', false);

insert into public.documents (id, kind, title, slug, body_md, client_visible) values
  ('00000000-0000-0000-0000-00000000d002', 'wiki', 'Runbook', 'runbook',
   'See [[Architecture]] before deploying. Also [[Nonexistent Page]].', false);

-- One shared with Org A's client, one belonging to Org B.
insert into public.documents (id, kind, project_id, title, slug, body_md, client_visible) values
  ('00000000-0000-0000-0000-00000000d003', 'doc', '00000000-0000-0000-0000-00000000a001',
   'Alpha Spec', 'alpha-spec', 'Shared with the Org A client.', true),
  ('00000000-0000-0000-0000-00000000d004', 'doc', '00000000-0000-0000-0000-00000000b001',
   'Bravo Spec', 'bravo-spec', 'Org B only.', true);

-- An edit, to prove the version trigger snapshots the PREVIOUS body.
update public.documents
   set body_md = 'How the thing is built. Now with more detail.'
 where id = '00000000-0000-0000-0000-00000000d001';

-- Meetings ---------------------------------------------------------------------
insert into public.meetings (id, project_id, title, starts_at, ends_at, client_visible) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-00000000a001',
   'Alpha sync', now() + interval '2 days', now() + interval '2 days 30 minutes', true),
  ('00000000-0000-0000-0000-00000000ee02', '00000000-0000-0000-0000-00000000b001',
   'Bravo sync', now() + interval '3 days', now() + interval '3 days 30 minutes', true);

insert into public.meeting_action_items (id, meeting_id, body) values
  ('00000000-0000-0000-0000-00000000ee03', '00000000-0000-0000-0000-00000000ee01',
   'Send revised scope');

-- Events -----------------------------------------------------------------------
insert into public.events (title, kind, starts_at, ends_at, project_id, client_visible) values
  ('Alpha freeze', 'deadline', now() + interval '5 days', now() + interval '5 days',
   '00000000-0000-0000-0000-00000000a001', true),
  ('Bravo freeze', 'deadline', now() + interval '5 days', now() + interval '5 days',
   '00000000-0000-0000-0000-00000000b001', true);

-- Chat -------------------------------------------------------------------------
insert into public.channels (id, kind, name, client_visible) values
  ('00000000-0000-0000-0000-00000000c001', 'workspace', 'internal-only', false);

insert into public.channels (id, kind, project_id, name, client_visible) values
  ('00000000-0000-0000-0000-00000000c002', 'project', '00000000-0000-0000-0000-00000000a001',
   'alpha-room', true),
  ('00000000-0000-0000-0000-00000000c003', 'project', '00000000-0000-0000-0000-00000000b001',
   'bravo-room', true);

-- An @mention of the employee, which must produce a notification.
insert into public.messages (channel_id, author_id, body) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
   'Heads up @emp — the Org B numbers are confidential.'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-0000000000a1',
   'Welcome to the Alpha room.'),
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-0000000000a1',
   'Bravo room, Org B only.');

-- Whiteboard --------------------------------------------------------------------
insert into public.boards (id, project_id, title, client_visible) values
  ('00000000-0000-0000-0000-00000000fa01', '00000000-0000-0000-0000-00000000a001',
   'Alpha flow', true),
  ('00000000-0000-0000-0000-00000000fa02', '00000000-0000-0000-0000-00000000b001',
   'Bravo flow', false);

insert into public.board_shapes (board_id, kind, text) values
  ('00000000-0000-0000-0000-00000000fa01', 'note', 'Sender picks a hub'),
  ('00000000-0000-0000-0000-00000000fa02', 'note', 'Org B internal idea');

select set_config('request.jwt.claim.sub', '', false);
