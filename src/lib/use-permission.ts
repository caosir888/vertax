"use client";

import { useState, useEffect } from "react";
import type { Role } from "@/types";
import { canDo } from "@/lib/permissions";
import type { Action } from "@/lib/permissions";

interface UserWithRole {
  name: string;
  email: string;
  role: Role;
}

// 在客户端获取当前用户角色 + 权限检查
export function usePermission() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setUser({ name: json.data.name, email: json.data.email, role: json.data.role || "viewer" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function can(action: Action): boolean {
    if (!user) return false;
    return canDo(user.role, action);
  }

  return { user, loading, can };
}
