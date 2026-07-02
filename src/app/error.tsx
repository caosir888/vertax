"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="text-4xl">⚠</div>
        <h2 className="mt-4 text-lg font-bold text-black">出了点问题</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {error.message || "页面加载时发生错误，请重试"}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
