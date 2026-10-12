import { NAV, isHidden } from '@/data/nav'
import { home } from '@/data/home'
import { projects, type ProjectView } from '@/data/projects'
import { SERVICES, PROCESS } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { profile } from '@/data/profile'

/**
 * What Lumen knows about the page the visitor has open, so "what's on this
 * page?" and "tell me about this one" have an answer. The widget sends its
 * pathname and hash; only a page listed here is believed, and a hidden page
 * never is. Server-only: it is never shipped to the browser.
 */

export type Page = { path: string; name: string; about: string }

const first = profile.name.split(' ')[0]
const label = (href: string) => NAV.find((n) => n.href === href)?.label ?? href

const BASE: Record<string, string> = {
  '/': `The overview: ${home.lede} Cards lead to ${first}'s projects, services and background, with the tools he works with.`,
  '/projects': `${projects.lede} The cards: ${[projects.cards.automations, projects.cards.plan, projects.cards.sites, projects.cards.agents, ...projects.writeups].map((c) => c.title).join(', ')}.`,
  '/services': `The six services (${SERVICES.map((s) => s.name).join(', ')}) and the five steps every project runs through (${PROCESS.map((s) => s.name).join(', ')}).`,
  '/about': `${first}'s background: who he is, the roles he works in, where he's based, his stack and his courses.`,
  '/contact': `The contact form and the common questions: ${FAQS.map((f) => f.q).join(' ')}`,
}

/** The Projects page's sub-views, each a card opened over the page (/projects#build-plan). */
const VIEWS: Record<ProjectView, { title: string; body: string }> = {
  automations: { title: projects.cards.automations.title, body: projects.cards.automations.body },
  'build-plan': { title: projects.cards.plan.title, body: projects.cards.plan.body },
  sites: { title: projects.cards.sites.title, body: projects.cards.sites.body },
  'ai-agents': { title: projects.cards.agents.title, body: projects.cards.agents.body },
  ...Object.fromEntries(projects.writeups.map((w) => [w.view, { title: w.title, body: w.desc }])),
} as Record<ProjectView, { title: string; body: string }>

/** The page a request names, or null when it names none this site shows. */
export function pageFor(raw: unknown): Page | null {
  if (typeof raw !== 'string' || raw.length > 200) return null
  const [path, hash = ''] = raw.split('#')
  if (!(path in BASE) || isHidden(path)) return null
  const view = path === '/projects' ? VIEWS[hash as ProjectView] : undefined
  if (view) return { path: `${path}#${hash}`, name: `${label(path)}, with "${view.title}" open`, about: `${view.body} It's a card on the Projects page, opened over it.` }
  return { path, name: label(path), about: BASE[path] }
}
