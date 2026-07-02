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

// ========== 通用类型 ==========

export type Role = "owner" | "admin" | "editor" | "viewer";

export type Status = "draft" | "review" | "published";
