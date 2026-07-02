import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200", className)}
      {...props}
    />
  );
}

// 预设骨架屏模板
function PageSkeleton() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-52 rounded-xl" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, PageSkeleton, CardSkeleton, ListSkeleton };
