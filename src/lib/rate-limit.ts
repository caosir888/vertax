// 简单的内存速率限制器
// 对于生产环境，建议使用 Redis 或 Upstash

const store = new Map<string, { count: number; reset: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, reset: entry.reset };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, reset: entry.reset };
}

// 定期清理过期条目（每 5 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.reset) store.delete(key);
  }
}, 5 * 60 * 1000);
