import { rateLimit } from '@/lib/rateLimit'

/** The visitor's address as the host reports it: the first x-forwarded-for entry, then x-real-ip, else 'unknown'. */
export const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

const allowed = rateLimit({ limit: 5, windowMs: 10 * 60 * 1000 })

/** Whether `ip` may send another message to Justine. The contact form and the assistant's lead tools share this one budget: 5 per 10 minutes. */
export function leadAllowed(ip: string): boolean {
  return allowed(ip)
}
