import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const key = process.env.JWT_SECRET;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET 环境变量未设置，生产环境必须配置");
    }
    return new TextEncoder().encode("dev-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(key);
}

// 需要登录才能访问的路由（管理后台所有模块）
const protectedPaths = [
  "/dashboard",
  "/memos",
  "/knowledge",
  "/content",
  "/leads",
  "/analytics",
  "/sites",
  "/tasks",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路由
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  // 获取 cookie 中的 token
  const token = request.cookies.get("vertax_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 验证 token 是否有效
  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/memos/:path*",
    "/knowledge/:path*",
    "/content/:path*",
    "/leads/:path*",
    "/analytics/:path*",
    "/sites/:path*",
    "/tasks/:path*",
    "/settings/:path*",
  ],
};
