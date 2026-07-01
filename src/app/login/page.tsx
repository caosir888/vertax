export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-2xl font-bold text-black">
          欢迎回来
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          登录你的 VertaX 账号
        </p>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="输入密码"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <a href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              忘记密码？
            </a>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            登录
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          还没有账号？{" "}
          <a href="/register" className="font-medium text-black underline">
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}
