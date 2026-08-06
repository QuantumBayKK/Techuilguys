/**
 * Hand-authored mirror of `supabase/migrations/0001_workspace.sql`.
 *
 * Kept by hand rather than generated so the repo has zero Supabase-CLI
 * dependency. If you change the migration, change this file in the same commit.
 */

export type Role = "admin" | "employee" | "client" | "pending";
export type ProjectStatus =
  | "discovery"
  | "building"
  | "review"
  | "launched"
  | "paused";
export type Health = "green" | "amber" | "red";
export type MilestoneStatus = "pending" | "in_progress" | "done" | "approved";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "med" | "high";
export type UpdateType = "progress" | "launch" | "blocker" | "note";
export type ParentType = "project" | "task" | "update" | "milestone";
export type RequestType = "new_project" | "change" | "bug" | "question";
export type RequestStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "done";

export type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  organization_id: string | null;
  weekly_capacity_hours: number;
  /** Short unique name for chat @mentions. Derived from the email local part. */
  handle: string;
  /** Heartbeat fallback for presence when no socket is open. */
  last_seen_at: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organization_id: string;
  status: ProjectStatus;
  health: Health;
  health_note: string | null;
  progress_pct: number;
  start_date: string | null;
  target_date: string | null;
  github_repo: string | null;
  notion_page_id: string | null;
  created_at: string;
};

export type ProjectMember = {
  project_id: string;
  profile_id: string;
  role_on_project: string | null;
};

export type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: MilestoneStatus;
  due_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  ref: number;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  priority: Priority;
  client_visible: boolean;
  order_index: number;
  due_date: string | null;
  created_at: string;
};

export type Update = {
  id: string;
  project_id: string;
  author_id: string | null;
  title: string;
  body_md: string;
  update_type: UpdateType;
  created_at: string;
};

export type Comment = {
  id: string;
  project_id: string;
  parent_type: ParentType;
  parent_id: string;
  author_id: string | null;
  body_md: string;
  internal_only: boolean;
  created_at: string;
};

export type FileRow = {
  id: string;
  project_id: string;
  uploader_id: string | null;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  client_visible: boolean;
  created_at: string;
};

export type TimeLog = {
  id: string;
  task_id: string | null;
  project_id: string;
  profile_id: string;
  minutes: number;
  logged_date: string;
  note: string | null;
  created_at: string;
};

export type ClientRequest = {
  id: string;
  project_id: string | null;
  organization_id: string;
  submitted_by: string | null;
  title: string;
  description: string;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
};

export type Notification = {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SearchHit = {
  kind: "project" | "task" | "update" | "file" | "document" | "meeting" | "message";
  id: string;
  /** Null for workspace-level documents, meetings and channels. */
  project_id: string | null;
  project_slug: string | null;
  title: string;
  subtitle: string | null;
  /**
   * Set by SQL for kinds that have one role-agnostic route. Null for the four
   * project-scoped kinds, whose path depends on whether you're staff (/projects)
   * or a client (/portal) — only the caller knows that.
   */
  href: string | null;
  rank: number;
};

/* ---------------------------------------------------------------------------
 * 0002 — collaboration surface
 * ------------------------------------------------------------------------ */

export type EventKind = "session" | "deadline" | "review" | "launch" | "holiday" | "other";
export type DocKind = "doc" | "wiki";
export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";
export type Rsvp = "pending" | "yes" | "no" | "maybe";
export type ChannelKind = "project" | "workspace" | "direct";
export type ShapeKind = "note" | "rect" | "ellipse" | "arrow" | "text" | "path";
export type NodeKind =
  | "project"
  | "task"
  | "document"
  | "meeting"
  | "file"
  | "milestone"
  | "person"
  | "channel"
  | "board";

export type CalendarEvent = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  kind: EventKind;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string | null;
  client_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** One row of `calendar_feed` — events, meetings and milestone dates unified. */
export type CalendarItem = {
  id: string;
  source: "event" | "meeting" | "milestone";
  kind: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  project_id: string | null;
  project_name: string | null;
  href: string;
};

export type Doc = {
  id: string;
  project_id: string | null;
  parent_id: string | null;
  kind: DocKind;
  title: string;
  slug: string;
  icon: string | null;
  body_md: string;
  order_index: number;
  client_visible: boolean;
  is_archived: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocVersion = {
  id: string;
  document_id: string;
  title: string;
  body_md: string;
  edited_by: string | null;
  created_at: string;
};

export type Meeting = {
  id: string;
  project_id: string | null;
  title: string;
  agenda_md: string;
  notes_md: string;
  status: MeetingStatus;
  starts_at: string;
  ends_at: string | null;
  join_url: string | null;
  recording_url: string | null;
  client_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingAttendee = {
  meeting_id: string;
  profile_id: string;
  response: Rsvp;
};

export type ActionItem = {
  id: string;
  meeting_id: string;
  body: string;
  owner_id: string | null;
  task_id: string | null;
  done: boolean;
  created_at: string;
};

export type Channel = {
  id: string;
  project_id: string | null;
  kind: ChannelKind;
  name: string;
  topic: string | null;
  client_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChannelMember = {
  channel_id: string;
  profile_id: string;
  last_read_at: string;
};

export type Message = {
  id: string;
  channel_id: string;
  author_id: string | null;
  body: string;
  reply_to: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  edited_at: string | null;
  created_at: string;
};

export type MessageReaction = {
  message_id: string;
  profile_id: string;
  emoji: string;
};

export type Board = {
  id: string;
  project_id: string | null;
  title: string;
  client_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Shape = {
  id: string;
  board_id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  /** Index into the app's neutral swatch set, 0–5. */
  tone: number;
  points: [number, number][] | null;
  z: number;
  created_by: string | null;
  updated_at: string;
};

export type GraphLink = {
  id: string;
  project_id: string | null;
  source_kind: NodeKind;
  source_id: string;
  target_kind: NodeKind;
  target_id: string;
  relation: string;
  created_by: string | null;
  created_at: string;
};

/** Shape of the `knowledge_graph()` jsonb payload. */
export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  href: string;
  project: string | null;
};
export type GraphEdge = { source: string; target: string; rel: string };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Row + Insert + Update triple in the shape `supabase-js` wants. */
type T<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: T<Organization, "name">;
      profiles: T<Profile, "id" | "email">;
      projects: T<Project, "name" | "slug" | "organization_id">;
      project_members: T<ProjectMember, "project_id" | "profile_id">;
      milestones: T<Milestone, "project_id" | "title">;
      tasks: T<Task, "project_id" | "title">;
      updates: T<Update, "project_id" | "title" | "body_md">;
      comments: T<Comment, "project_id" | "parent_type" | "parent_id" | "body_md">;
      files: T<FileRow, "project_id" | "name" | "storage_path" | "size_bytes">;
      time_logs: T<TimeLog, "project_id" | "profile_id" | "minutes" | "logged_date">;
      requests: T<ClientRequest, "organization_id" | "title" | "description">;
      notifications: T<Notification, "profile_id" | "type" | "title">;
      audit_log: T<AuditEntry, "action" | "entity_type">;

      events: T<CalendarEvent, "title" | "starts_at" | "ends_at">;
      documents: T<Doc, "title" | "slug">;
      document_versions: T<DocVersion, "document_id" | "title" | "body_md">;
      meetings: T<Meeting, "title" | "starts_at">;
      meeting_attendees: T<MeetingAttendee, "meeting_id" | "profile_id">;
      meeting_action_items: T<ActionItem, "meeting_id" | "body">;
      channels: T<Channel, "name">;
      channel_members: T<ChannelMember, "channel_id" | "profile_id">;
      messages: T<Message, "channel_id" | "body">;
      message_reactions: T<MessageReaction, "message_id" | "profile_id" | "emoji">;
      boards: T<Board, "title">;
      board_shapes: T<Shape, "board_id">;
      links: T<GraphLink, "source_kind" | "source_id" | "target_kind" | "target_id">;
    };
    Views: Record<string, never>;
    Functions: {
      current_role_of: { Args: Record<string, never>; Returns: string };
      current_org_of: { Args: Record<string, never>; Returns: string };
      workspace_search: {
        Args: { q: string };
        Returns: SearchHit[];
      };
      approve_milestone: {
        Args: { p_milestone: string };
        Returns: undefined;
      };
      reorder_tasks: {
        Args: { p_ids: string[]; p_status: TaskStatus };
        Returns: undefined;
      };
      calendar_feed: {
        Args: { p_from: string; p_to: string; p_project?: string | null };
        Returns: CalendarItem[];
      };
      unread_counts: {
        Args: Record<string, never>;
        Returns: { channel_id: string; unread: number }[];
      };
      mark_channel_read: { Args: { p_channel: string }; Returns: undefined };
      touch_presence: { Args: Record<string, never>; Returns: undefined };
      knowledge_graph: { Args: { p_project?: string | null }; Returns: Graph };
      action_item_to_task: { Args: { p_item: string }; Returns: string };
    };
    Enums: {
      user_role: Role;
      project_status: ProjectStatus;
      health_level: Health;
      milestone_status: MilestoneStatus;
      task_status: TaskStatus;
      task_priority: Priority;
      update_type: UpdateType;
      comment_parent: ParentType;
      request_type: RequestType;
      request_status: RequestStatus;
      event_kind: EventKind;
      doc_kind: DocKind;
      meeting_status: MeetingStatus;
      rsvp: Rsvp;
      channel_kind: ChannelKind;
      shape_kind: ShapeKind;
      node_kind: NodeKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
