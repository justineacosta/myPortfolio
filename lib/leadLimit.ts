import { rateLimit } from '@/lib/rateLimit'

declare global {
  var __kraftLeadLimit: ReturnType<typeof rateLimit> | undefined
}

/** The visitor's address as the host reports it: the first x-forwarded-for entry, then x-real-ip, else 'unknown'. */
export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

// On `globalThis` because Next may bundle the contact route and the chat routes separately, and each bundle would otherwise count on its own.
const allowed = (globalThis.__kraftLeadLimit ??= rateLimit({ limit: 5, windowMs: 10 * 60 * 1000 }))

/** Whether `ip` may send another message to Justine. The contact form uses this budget: 5 per 10 minutes. */
export function leadAllowed(ip: string): boolean {
  return allowed(ip)
}
