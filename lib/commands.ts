import type { Icon } from '@phosphor-icons/react'
import { NAV } from '@/data/nav'

/** ⌘K entries. Phase 1: pages. Later phases append key sections. */
export type Command = { id: string; label: string; hint: string; href: string; icon: Icon }

export const COMMANDS: Command[] = NAV.map((n) => ({
  id: n.href,
  label: n.label,
  hint: n.hint,
  href: n.href,
  icon: n.icon,
}))

/** Kraft's filter (Kraft Portfolio.dc.html:705-706): label or hint contains the query. */
export function filterCommands(query: string, list: Command[] = COMMANDS): Command[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
}
