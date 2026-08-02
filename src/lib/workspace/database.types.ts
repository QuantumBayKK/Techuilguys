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
  kind: "project" | "task" | "update" | "file";
  id: string;
  project_id: string;
  project_slug: string;
  title: string;
  subtitle: string | null;
  rank: number;
};

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
    };
    CompositeTypes: Record<string, never>;
  };
};
