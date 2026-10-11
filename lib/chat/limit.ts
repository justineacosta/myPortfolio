import { rateLimit } from '@/lib/rateLimit'

declare global {
  var __kraftChatLimit: ReturnType<typeof rateLimit> | undefined
}

// On `globalThis` for the same reason as lib/leadLimit.ts: Next may bundle the chat route more than once, and each bundle would otherwise count on its own.
const allowed = (globalThis.__kraftChatLimit ??= rateLimit({ limit: 30, windowMs: 60 * 60 * 1000 }))

/**
 * Whether `ip` may send Claude another question: 30 an hour. Only the paid
 * path is limited. The offline rules cost nothing, and on serverless this
 * count is per instance, so limiting them could only turn visitors away.
 */
export function chatAllowed(ip: string): boolean {
  return allowed(ip)
}
