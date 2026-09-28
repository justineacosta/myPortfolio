import type { Icon } from '@phosphor-icons/react'
import { ChatCircleDotsIcon, LightningIcon, TreeStructureIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { NAV } from '@/data/nav'
import { projects, type ProjectView } from '@/data/projects'
import { servicesPage } from '@/data/services'

/** ⌘K entries (spec §7): every page, then the key sections. */
export type Command = { id: string; label: string; hint: string; href: string; icon: Icon }

const PAGES: Command[] = NAV.map((n) => ({ id: n.href, label: n.label, hint: n.hint, href: n.href, icon: n.icon }))

const hintOf = (href: string) => NAV.find((n) => n.href === href)!.hint
const view = (id: ProjectView, label: string, icon: Icon): Command => ({
  id,
  label,
  hint: hintOf('/projects'),
  href: `/projects#${id}`,
  icon,
})
const c = projects.cards

/** The board's sub-views open in place (hooks/useHashView.ts); the rest scroll into view (lib/scroller.ts). */
export const SECTIONS: Command[] = [
  view('reel', c.reel.title, c.reel.icon),
  view('build-plan', c.plan.title, c.plan.icon),
  ...projects.writeups.map((w) => view(w.view, w.title, w.icon)),
  view('sites', c.sites.title, c.sites.icon),
  view('ai-agents', c.agents.title, c.agents.icon),
  { id: servicesPage.method.id, label: servicesPage.method.label, hint: hintOf('/services'), href: `/services#${servicesPage.method.id}`, icon: TreeStructureIcon },
  { id: servicesPage.automation.id, label: servicesPage.automation.label, hint: hintOf('/services'), href: `/services#${servicesPage.automation.id}`, icon: LightningIcon },
  { id: contact.faqs.id, label: contact.faqs.label, hint: hintOf('/contact'), href: `/contact#${contact.faqs.id}`, icon: ChatCircleDotsIcon },
]

export const COMMANDS: Command[] = [...PAGES, ...SECTIONS]

/** Kraft's filter (Kraft Portfolio.dc.html:705-706): label or hint contains the query. */
export function filterCommands(query: string, list: Command[] = COMMANDS): Command[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.hint.toLowerCase().includes(q))
}
