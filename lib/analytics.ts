import { track as send } from '@vercel/analytics'
import type { BeforeSend } from '@vercel/analytics/next'

/**
 * Vercel Web Analytics: cookie-free page views (mounted in app/layout.tsx)
 * and the few events below. Each event names a page, a view or a sample
 * site, never what a visitor typed. Custom events need Vercel Pro; on Hobby
 * they are dropped and page views still count.
 */
type Events = {
  'Lumen opened': undefined
  'Lumen message': undefined
  'Contact sent': undefined
  'Project opened': { view: string }
  'Sample site opened': { site: string }
}

export function track<E extends keyof Events>(...[name, props]: Events[E] extends undefined ? [E] : [E, Events[E]]): void {
  try {
    send(name, props)
  } catch {
    // An ad blocker or a failed script must never break the page.
  }
}

/** Lumen's embed frame (app/(embed)/lumen) sits inside other pages, so its page views aren't visits. Its events still count. */
export const beforeSend: BeforeSend = (event) =>
  event.type === 'pageview' && new URL(event.url).pathname === '/lumen' ? null : event
