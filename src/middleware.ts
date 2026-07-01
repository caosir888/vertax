import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production-123456"
);

// 需要登录才能访问的路由（管理后台所有模块）
const protectedPaths = [
  "/dashboard",
  "/memos",
  "/knowledge",
  "/content",
  "/leads",
  "/analytics",
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
    await jwtVerify(token, secret);
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
    "/settings/:path*",
  ],
};
