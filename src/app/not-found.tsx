import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold text-black">404</h1>
        <p className="mt-2 text-sm text-zinc-500">页面不存在</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
