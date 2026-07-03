"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-zinc-50 font-sans">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl">⚠</div>
            <h1 className="mt-4 text-xl font-bold text-black">系统异常</h1>
            <p className="mt-2 text-sm text-zinc-500 max-w-md">
              {error.message || "发生了一个错误，请刷新页面重试"}
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
