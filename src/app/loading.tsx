export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
        <span className="h-3 w-3 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
        <span className="h-3 w-3 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
