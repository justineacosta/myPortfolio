/**
 * A fixed-window rate limit kept in memory. On serverless each instance keeps
 * its own count, so it is a speed bump, not a guarantee. The returned
 * function answers whether `key` may go ahead at `now`.
 */
export function rateLimit({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { start: number; count: number }>()
  const hit = (key: string, now = Date.now()) => {
    // Drop windows that are over, so the map only holds keys still counting.
    for (const [k, w] of hits) if (now - w.start >= windowMs) hits.delete(k)
    const w = hits.get(key)
    if (!w) {
      hits.set(key, { start: now, count: 1 })
      return true
    }
    if (w.count >= limit) return false
    w.count++
    return true
  }
  return Object.assign(hit, { size: () => hits.size })
}
