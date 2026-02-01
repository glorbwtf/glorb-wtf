/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests per IP address with configurable limits and windows
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitStore>>();

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

/**
 * Rate limit checker
 * @param namespace Unique identifier for this rate limiter (e.g., 'api:chat')
 * @param identifier Client identifier (usually IP address)
 * @param config Rate limit configuration
 * @returns Promise that resolves if within limits, rejects with RateLimitError if exceeded
 */
export async function rateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 }
): Promise<void> {
  // Get or create store for this namespace
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }
  const store = stores.get(namespace)!;

  const now = Date.now();
  const tokenData = store.get(identifier);

  // First request or expired window
  if (!tokenData || now > tokenData.resetTime) {
    store.set(identifier, {
      count: 1,
      resetTime: now + config.interval,
    });
    return;
  }

  // Within window - check limit
  if (tokenData.count >= config.uniqueTokenPerInterval) {
    const retryAfter = Math.ceil((tokenData.resetTime - now) / 1000);
    throw new RateLimitError(retryAfter);
  }

  // Increment count
  tokenData.count++;
  store.set(identifier, tokenData);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers first
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to generic identifier
  return 'unknown';
}

/**
 * Cleanup old entries (call periodically to prevent memory leaks)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [namespace, store] of stores.entries()) {
    for (const [identifier, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(identifier);
      }
    }
    // Remove empty stores
    if (store.size === 0) {
      stores.delete(namespace);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
