-- ============================================================================
-- Assertions. Plain `raise exception` rather than pgTAP, so the suite has no
-- dependency beyond a Postgres container.
--
-- Everything from §3 onward runs as the `authenticated` role with a JWT claim,
-- which is the ONLY way these tests mean anything: as the table owner, RLS is
-- bypassed and every isolation check would pass vacuously.
-- ============================================================================

\set ON_ERROR_STOP on

create or replace function pg_temp.ok(cond boolean, label text)
returns void language plpgsql as $$
begin
  if cond then
    raise notice '  PASS  %', label;
  else
    raise exception 'FAIL  %', label;
  end if;
end $$;

/* ===========================================================================
 * 1. Triggers
 * ======================================================================== */
\echo ''
\echo '1. Triggers'

do $$
declare n int;
begin
  -- [[Architecture]] resolves to a real page → one edge. [[Nonexistent Page]]
  -- does not exist → no edge, and no error either.
  select count(*) into n from public.links
   where source_id = '00000000-0000-0000-0000-00000000d002'
     and target_id = '00000000-0000-0000-0000-00000000d001'
     and relation = 'mentions';
  perform pg_temp.ok(n = 1, 'wiki [[link]] became a graph edge');

  select count(*) into n from public.links
   where source_id = '00000000-0000-0000-0000-00000000d002';
  perform pg_temp.ok(n = 1, 'unresolved [[link]] produced no edge');

  -- The version holds the body as it was BEFORE the edit.
  select count(*) into n from public.document_versions
   where document_id = '00000000-0000-0000-0000-00000000d001'
     and body_md = 'How the thing is built.';
  perform pg_temp.ok(n = 1, 'document edit snapshotted the previous body');

  select count(*) into n from public.notifications
   where type = 'chat.mention'
     and profile_id = '00000000-0000-0000-0000-0000000000e1';
  perform pg_temp.ok(n = 1, '@mention created exactly one notification');

  -- Sending implicitly joins the channel.
  select count(*) into n from public.channel_members
   where profile_id = '00000000-0000-0000-0000-0000000000a1'
     and channel_id = '00000000-0000-0000-0000-00000000c001';
  perform pg_temp.ok(n = 1, 'sending a message joined the channel');

  select count(*) into n from public.profiles where handle is null;
  perform pg_temp.ok(n = 0, 'every profile got a handle');

  select count(distinct handle) into n from public.profiles;
  perform pg_temp.ok(
    n = (select count(*) from public.profiles),
    'handles are unique'
  );
end $$;

/* ===========================================================================
 * 2. RPCs still compile and return
 * ======================================================================== */
\echo ''
\echo '2. RPCs'

do $$
declare g jsonb; n int;
begin
  select public.knowledge_graph(null) into g;
  perform pg_temp.ok(
    jsonb_array_length(g->'nodes') > 0,
    'knowledge_graph returns nodes'
  );
  perform pg_temp.ok(
    jsonb_array_length(g->'edges') > 0,
    'knowledge_graph returns edges'
  );

  select count(*) into n from public.calendar_feed(
    now() - interval '30 days', now() + interval '30 days', null
  );
  perform pg_temp.ok(n >= 4, 'calendar_feed unions events + meetings + milestones');

  select count(*) into n from public.workspace_search('alpha');
  perform pg_temp.ok(n > 0, 'workspace_search matches across the new tables');

  -- 0002 seeds a `general` channel, so don't hard-code the number.
  select count(*) into n from public.unread_counts();
  perform pg_temp.ok(
    n = (select count(*) from public.channels),
    'unread_counts covers every channel'
  );
end $$;

-- action_item_to_task must be idempotent: two calls, one task.
do $$
declare a uuid; b uuid;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
  select public.action_item_to_task('00000000-0000-0000-0000-00000000ee03') into a;
  select public.action_item_to_task('00000000-0000-0000-0000-00000000ee03') into b;
  perform pg_temp.ok(a = b, 'action_item_to_task is idempotent');
  perform set_config('request.jwt.claim.sub', '', false);
end $$;

/* ===========================================================================
 * 3. Tenant isolation — the whole point of the schema.
 *
 * Ann is a client of Org A. Every count below is what ANN can see, under RLS,
 * as the `authenticated` role. Any non-zero on an Org B row is a data leak.
 * ======================================================================== */
\echo ''
\echo '3. Tenant isolation (as Ann, client of Org A)'

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);

do $$
declare n int;
begin
  perform pg_temp.ok(public.current_role_of() = 'client', 'Ann is seen as a client');

  select count(*) into n from public.projects;
  perform pg_temp.ok(n = 1, 'sees exactly one project');

  select count(*) into n from public.projects where slug = 'bravo-build';
  perform pg_temp.ok(n = 0, 'cannot see Org B''s project by slug');

  -- Documents: the shared Org A doc only. Not Org B's, not the internal wiki.
  select count(*) into n from public.documents;
  perform pg_temp.ok(n = 1, 'sees only the one document shared with her');

  select count(*) into n from public.documents where slug = 'bravo-spec';
  perform pg_temp.ok(n = 0, 'cannot see Org B''s shared document');

  select count(*) into n from public.documents where kind = 'wiki';
  perform pg_temp.ok(n = 0, 'cannot see the internal wiki');

  -- Version history must not become a side channel around the document policy.
  select count(*) into n from public.document_versions;
  perform pg_temp.ok(n = 0, 'cannot read version history of hidden documents');

  select count(*) into n from public.channels;
  perform pg_temp.ok(n = 1, 'sees only the client-visible channel for her project');

  select count(*) into n from public.messages;
  perform pg_temp.ok(n = 1, 'sees only messages in that channel');

  select count(*) into n from public.messages where body like '%confidential%';
  perform pg_temp.ok(n = 0, 'cannot read the internal channel''s messages');

  select count(*) into n from public.meetings;
  perform pg_temp.ok(n = 1, 'sees only her own meeting');

  select count(*) into n from public.events;
  perform pg_temp.ok(n = 1, 'sees only her own calendar entry');

  select count(*) into n from public.boards;
  perform pg_temp.ok(n = 1, 'sees only the shared whiteboard');

  select count(*) into n from public.board_shapes;
  perform pg_temp.ok(n = 1, 'sees only that whiteboard''s shapes');

  select count(*) into n from public.board_shapes where text like '%Org B%';
  perform pg_temp.ok(n = 0, 'cannot read Org B''s whiteboard contents');

  select count(*) into n from public.time_logs;
  perform pg_temp.ok(n = 0, 'sees no time logs at all');

  select count(*) into n from public.audit_log;
  perform pg_temp.ok(n = 0, 'sees no audit log');

  select count(*) into n from public.links;
  perform pg_temp.ok(n = 0, 'sees no workspace-level graph edges');
end $$;

-- Search and the graph are SECURITY INVOKER, so they must inherit all of that.
do $$
declare n int; g jsonb;
begin
  select count(*) into n from public.workspace_search('bravo');
  perform pg_temp.ok(n = 0, 'search cannot surface Org B by name');

  select count(*) into n from public.workspace_search('confidential');
  perform pg_temp.ok(n = 0, 'search cannot surface internal chat');

  select count(*) into n from public.workspace_search('roadmap');
  perform pg_temp.ok(n <= 1, 'search returns at most her own project');

  -- Her event, her meeting, and her project's milestone — clients see
  -- milestone dates by design, that is the portal timeline.
  select count(*) into n from public.calendar_feed(
    now() - interval '30 days', now() + interval '30 days', null
  );
  perform pg_temp.ok(n = 3, 'calendar shows her event, meeting and milestone');

  select count(*) into n from public.calendar_feed(
    now() - interval '30 days', now() + interval '30 days', null
  ) where title like '%Bravo%';
  perform pg_temp.ok(n = 0, 'calendar contains nothing from Org B');

  select public.knowledge_graph(null) into g;
  perform pg_temp.ok(
    not (g::text like '%Bravo%'),
    'knowledge graph contains nothing from Org B'
  );
  perform pg_temp.ok(
    not (g::text like '%Runbook%'),
    'knowledge graph contains no internal wiki pages'
  );
end $$;

/* ===========================================================================
 * 4. Privilege escalation
 * ======================================================================== */
\echo ''
\echo '4. Privilege escalation'

do $$
declare r text; org uuid;
begin
  -- The profile policy lets you edit your own row; the guard trigger silently
  -- reverts the two columns that would matter.
  update public.profiles set role = 'admin'
   where id = '00000000-0000-0000-0000-0000000000c1';
  select role::text into r from public.profiles
   where id = '00000000-0000-0000-0000-0000000000c1';
  perform pg_temp.ok(r = 'client', 'a client cannot promote herself to admin');

  update public.profiles set organization_id = '00000000-0000-0000-0000-00000000b000'
   where id = '00000000-0000-0000-0000-0000000000c1';
  select organization_id into org from public.profiles
   where id = '00000000-0000-0000-0000-0000000000c1';
  perform pg_temp.ok(
    org = '00000000-0000-0000-0000-00000000a000',
    'a client cannot move herself into another organization'
  );
end $$;

-- Writes into another tenant must be refused, not silently dropped.
do $$
declare blocked boolean := false;
begin
  begin
    insert into public.messages (channel_id, author_id, body)
    values ('00000000-0000-0000-0000-00000000c003',
            '00000000-0000-0000-0000-0000000000c1', 'I should not be here');
  exception when insufficient_privilege or check_violation then
    blocked := true;
  end;
  perform pg_temp.ok(blocked, 'cannot post into Org B''s channel');
end $$;

do $$
declare blocked boolean := false;
begin
  begin
    insert into public.documents (kind, title, slug, body_md)
    values ('wiki', 'Injected', 'injected', 'nope');
  exception when insufficient_privilege then
    blocked := true;
  end;
  perform pg_temp.ok(blocked, 'a client cannot create documents');
end $$;

do $$
declare blocked boolean := false;
begin
  begin
    insert into public.events (title, starts_at, ends_at)
    values ('Injected', now(), now());
  exception when insufficient_privilege then
    blocked := true;
  end;
  perform pg_temp.ok(blocked, 'a client cannot create calendar entries');
end $$;

/* ===========================================================================
 * 5. What a client SHOULD be able to do
 * ======================================================================== */
\echo ''
\echo '5. Permitted client writes'

do $$
declare n int;
begin
  -- Posting in her own project's shared channel.
  insert into public.messages (channel_id, author_id, body)
  values ('00000000-0000-0000-0000-00000000c002',
          '00000000-0000-0000-0000-0000000000c1', 'Thanks, looks good.');
  select count(*) into n from public.messages
   where channel_id = '00000000-0000-0000-0000-00000000c002';
  perform pg_temp.ok(n = 2, 'can post in her own project channel');

  -- A shared board is collaborative by design.
  insert into public.board_shapes (board_id, kind, text)
  values ('00000000-0000-0000-0000-00000000fa01', 'note', 'Client idea');
  select count(*) into n from public.board_shapes;
  perform pg_temp.ok(n = 2, 'can draw on a board shared with her');
end $$;

reset role;
select set_config('request.jwt.claim.sub', '', false);

/* ===========================================================================
 * 6. Employee scope — staff see everything, but time is still personal.
 * ======================================================================== */
\echo ''
\echo '6. Employee scope'

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);

do $$
declare n int;
begin
  perform pg_temp.ok(public.is_staff(), 'Eli is seen as staff');

  select count(*) into n from public.projects;
  perform pg_temp.ok(n = 2, 'staff see every project');

  select count(*) into n from public.documents;
  perform pg_temp.ok(n = 4, 'staff see every document');

  -- By name, not by count: 0002 seeds `general`, and a future seed would make
  -- a hard-coded number fail for a reason that has nothing to do with access.
  select count(*) into n from public.channels
   where name in ('internal-only', 'alpha-room', 'bravo-room');
  perform pg_temp.ok(n = 3, 'staff see internal, and both projects'' channels');

  select count(*) into n from public.messages where body like '%Org B only%';
  perform pg_temp.ok(n = 1, 'staff can read across organizations');

  select count(*) into n from public.audit_log;
  perform pg_temp.ok(n = 0, 'an employee still cannot read the audit log');
end $$;

reset role;
select set_config('request.jwt.claim.sub', '', false);

\echo ''
\echo 'All assertions passed.'
