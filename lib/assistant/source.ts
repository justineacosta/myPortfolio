import { commands, type Command } from '@/lib/commands'
import { isPlaceholder } from '@/lib/placeholder'

/** A string, or nothing when it is a content gap ("PLACEHOLDER - …"). */
export const clean = (s: string | undefined) => (s && !isPlaceholder(s) ? s : '')

/**
 * The links the assistant may give: only commands() entries, so a page that is switched off (data/nav.ts) has no link.
 * Read at call time, so call it per build rather than once at module load.
 */
export function siteLinks(): { page(href: string): Command | undefined; ref(href: string): string } {
  const cmds = commands()
  const page = (href: string) => cmds.find((c) => c.href === href)
  return {
    page,
    /** `[Label](href)`, or '' when the page is off. */
    ref: (href) => {
      const c = page(href)
      return c ? `[${c.label}](${href})` : ''
    },
  }
}
