// ========== 用户相关 ==========

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  team_id?: string;
}

// ========== 备忘录相关 ==========

export interface Memo {
  id: string;
  user_id: string;
  team_id: string;
  title: string;
  content: string;
  created_at: string;
}

// ========== API 响应格式 ==========

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ========== 团队相关 ==========

export interface Team {
  id: string;
  name: string;
  company_name?: string;
  industry?: string;
  logo_url?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  user_name: string;
  user_email: string;
  created_at: string;
}

// ========== API Key 相关 ==========

export interface ApiKey {
  id: string;
  team_id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at?: string;
}

// ========== 知识库文档 ==========

export interface Document {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
}

// ========== 通用类型 ==========

export type Role = "owner" | "admin" | "editor" | "viewer";

export type Status = "draft" | "review" | "published";

// ========== 内容评论 ==========

export interface ContentComment {
  id: string;
  content_id: string;
  team_id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
}

// ========== 任务 ==========

export interface Task {
  id: string;
  team_id: string;
  creator_id: string;
  assignee_id?: string;
  assignee_name?: string;
  target_type?: string;
  target_id?: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

// ========== 在线状态 ==========

export interface UserPresence {
  id: string;
  user_id: string;
  team_id: string;
  user_name: string;
  current_page: string;
  last_seen_at: string;
}
