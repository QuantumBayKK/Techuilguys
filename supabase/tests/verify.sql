-- ============================================================================
-- Post-migration health check. Read-only — safe to run on production, any time.
--
-- Paste the whole thing into the Supabase SQL editor AFTER applying
-- 0001_workspace.sql and 0002_collaboration.sql. Every row should say OK.
--
-- This exists because the SQL editor runs a file as one batch: if a statement
-- near the end fails, everything before it still applied and the error is easy
-- to scroll past. That is exactly how the `project-files` bucket went missing
-- on the first build.
-- ============================================================================

with expected as (
  select * from (values
    ('table',    'organizations'), ('table', 'profiles'),   ('table', 'projects'),
    ('table',    'project_members'),('table','milestones'),  ('table', 'tasks'),
    ('table',    'updates'),       ('table', 'comments'),   ('table', 'files'),
    ('table',    'time_logs'),     ('table', 'requests'),   ('table', 'notifications'),
    ('table',    'audit_log'),
    ('table',    'events'),        ('table', 'documents'),  ('table', 'document_versions'),
    ('table',    'meetings'),      ('table', 'meeting_attendees'),
    ('table',    'meeting_action_items'),
    ('table',    'channels'),      ('table', 'channel_members'),
    ('table',    'messages'),      ('table', 'message_reactions'),
    ('table',    'boards'),        ('table', 'board_shapes'), ('table', 'links'),

    ('function', 'can_see'),       ('function', 'is_staff'),
    ('function', 'is_admin'),      ('function', 'is_channel_member'),
    ('function', 'current_role_of'),('function','current_org_of'),
    ('function', 'can_read_project'),
    ('function', 'calendar_feed'), ('function', 'knowledge_graph'),
    ('function', 'workspace_search'),('function','unread_counts'),
    ('function', 'mark_channel_read'),('function','touch_presence'),
    ('function', 'action_item_to_task'),('function','approve_milestone'),
    ('function', 'notify_profiles'),('function','audit'),

    ('bucket',   'project-files'), ('bucket', 'chat-attachments')
  ) as t(kind, name)
),
found as (
  select 'table' as kind, tablename as name
    from pg_tables where schemaname = 'public'
  union all
  select 'function', proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
  union all
  select 'bucket', id from storage.buckets
)
select
  e.kind,
  e.name,
  case when f.name is null then '✗ MISSING' else 'OK' end as status
from expected e
left join (select distinct kind, name from found) f
       on f.kind = e.kind and f.name = e.name
order by (f.name is null) desc, e.kind, e.name;

-- ---------------------------------------------------------------------------
-- Row Level Security must be ON for every table. A table with policies but RLS
-- disabled is wide open and looks completely fine in the dashboard.
-- ---------------------------------------------------------------------------
select
  c.relname as table_name,
  case when c.relrowsecurity then 'OK' else '✗ RLS DISABLED' end as rls,
  count(p.polname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;

-- ---------------------------------------------------------------------------
-- Realtime. These tables must be in the publication or the UI will not update
-- live, and `board_shapes` / `messages` need FULL replica identity or their
-- UPDATE payloads carry only the primary key.
-- ---------------------------------------------------------------------------
with want(name) as (values
  ('tasks'),('comments'),('updates'),('milestones'),('notifications'),('requests'),
  ('events'),('documents'),('meetings'),('meeting_attendees'),('meeting_action_items'),
  ('channels'),('messages'),('message_reactions'),('boards'),('board_shapes'),('links')
)
select
  w.name as table_name,
  case when p.tablename is null then '✗ NOT PUBLISHED' else 'OK' end as realtime,
  case
    when w.name in ('board_shapes','messages') and c.relreplident <> 'f'
      then '✗ needs REPLICA IDENTITY FULL'
    else 'OK'
  end as replica_identity
from want w
left join pg_publication_tables p
       on p.tablename = w.name
      and p.pubname = 'supabase_realtime'
      and p.schemaname = 'public'
left join pg_class c on c.relname = w.name
left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
order by (p.tablename is null) desc, w.name;

-- ---------------------------------------------------------------------------
-- The two functions ⌘K and the graph depend on. If 0001's `ORDER BY rank` bug
-- were still present, workspace_search would not exist at all and everything
-- after it in the file would be missing too.
-- ---------------------------------------------------------------------------
-- `workspace_search` must show an `href text` column — that is the 0002 shape.
-- If it is missing, 0002's search block did not apply and ⌘K will not reach
-- docs, meetings or chat.
select
  p.proname,
  pg_get_function_result(p.oid) as returns,
  case
    when p.proname = 'workspace_search' and pg_get_function_result(p.oid) not like '%href%'
      then '✗ still on the 0001 shape — re-run 0002'
    else 'OK'
  end as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('workspace_search', 'knowledge_graph', 'calendar_feed')
order by p.proname;
