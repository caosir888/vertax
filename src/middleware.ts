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

// 独立站域名 → site_id 映射
const SITE_DOMAINS: Record<string, string> = {
  "caosir888.online": "2fd8209f-d3f2-4f33-af94-400eb8e7d84c",
  "www.caosir888.online": "2fd8209f-d3f2-4f33-af94-400eb8e7d84c",
};

// 需要登录才能访问的路由
const protectedPaths = [
  "/dashboard",
  "/memos",
  "/knowledge",
  "/content",
  "/leads",
  "/opportunities",
  "/radar",
  "/growth",
  "/analytics",
  "/sites",
  "/tasks",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // === 独立站域名：无需登录，直接展示 ===
  const siteId = SITE_DOMAINS[hostname];
  if (siteId) {
    if (pathname === "/robots.txt") {
      return NextResponse.rewrite(new URL(`/api/sites/${siteId}/robots`, request.url));
    }
    if (pathname === "/sitemap.xml") {
      return NextResponse.rewrite(new URL(`/api/sites/${siteId}/sitemap`, request.url));
    }
    if (pathname.startsWith("/api/sites/")) {
      return NextResponse.next();
    }
    // 所有页面请求 → 独立站预览
    return NextResponse.rewrite(new URL(`/api/sites/${siteId}/preview`, request.url));
  }

  // === 主站：认证保护 ===
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("vertax_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
    "/opportunities/:path*",
    "/radar/:path*",
    "/growth/:path*",
    "/analytics/:path*",
    "/sites/:path*",
    "/tasks/:path*",
    "/settings/:path*",
    // 独立站域名需要匹配所有页面路径
    "/",
    "/:path",
  ],
};
