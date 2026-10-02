import { readFileSync } from 'node:fs'

/**
 * The page switches in data/nav.ts, read from its text: Playwright cannot
 * load the icon package that module imports. One NAV line per page, as
 * `{ href: '/x', label: 'X', … hidden: true }`.
 */
export const SWITCHES = [...readFileSync('data/nav.ts', 'utf8').matchAll(/\{ href: '([^']+)', label: '([^']+)',[^\n]*hidden: (true|false) \}/g)].map(
  ([, href, label, hidden]) => ({ href, label, hidden: hidden === 'true' }),
)

/** Switched off in data/nav.ts: the build under test answers it with the 404. */
export const isHidden = (href: string) => SWITCHES.some((s) => s.hidden && s.href === href.split('#')[0])

/**
 * The routes a visitor can reach. Sweeps over every page skip a switched-off
 * one, and a page's own tests run only while it is switched on.
 */
export const shown = (routes: string[]) => routes.filter((r) => !isHidden(r))
