import { rateLimit } from '@/lib/rateLimit'

declare global {
  var __kraftChatLimit: ReturnType<typeof rateLimit> | undefined
}

// On `globalThis` for the same reason as lib/leadLimit.ts: Next may bundle the chat route more than once, and each bundle would otherwise count on its own.
const allowed = (globalThis.__kraftChatLimit ??= rateLimit({ limit: 20, windowMs: 60 * 60 * 1000 }))

/** Whether `ip` may ask the chat another question. The budget is 20 per hour. */
export function chatAllowed(ip: string): boolean {
  return allowed(ip)
}
