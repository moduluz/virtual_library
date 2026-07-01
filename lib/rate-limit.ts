/**
 * Rate limiter utility
 *
 * Uses Upstash Redis in production (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
 * Falls back to a simple in-memory limiter for local development.
 */

// ─── In-memory fallback (dev only) ────────────────────────────────────────────
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count++;
  inMemoryStore.set(key, entry);

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetAt,
  };
}

// ─── Rate limit configs ────────────────────────────────────────────────────────
export type RateLimitConfig = {
  limit: number;      // max requests
  windowMs: number;   // window in milliseconds
};

export const RATE_LIMITS = {
  /** Strict: 5 requests per 15 minutes — for auth endpoints */
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Standard: 60 requests per minute — for regular API endpoints */
  api: { limit: 60, windowMs: 60 * 1000 },
  /** Loose: 10 uploads per hour — for file upload endpoints */
  upload: { limit: 10, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, RateLimitConfig>;

// ─── Main rate limit function ──────────────────────────────────────────────────
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rl:${identifier}`;

  // Try Upstash Redis if configured
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs}ms`),
        analytics: true,
      });

      const result = await limiter.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (e) {
      console.warn("[rateLimit] Upstash error, falling back to in-memory:", e);
    }
  }

  // Fallback to in-memory (local dev)
  return inMemoryLimit(key, config.limit, config.windowMs);
}

/**
 * Helper: get a stable identifier from a request.
 * Uses the real IP in production, falls back to a header or "unknown".
 */
export function getIdentifier(request: Request, suffix = ""): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return suffix ? `${ip}:${suffix}` : ip;
}
