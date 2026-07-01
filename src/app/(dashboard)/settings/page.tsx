export default function SettingsPage() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-black">设置</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Team 信息编辑、成员管理、API Key 管理、权限配置。
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 py-24 text-center text-sm text-zinc-400">
          设置功能将在第 4 周（多租户架构）实现
        </div>
      </div>
    </div>
  );
}
