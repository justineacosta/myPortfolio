import { NAV, isHidden } from '@/data/nav'
import { home } from '@/data/home'
import { notesPage } from '@/data/notes'
import { projects, type ProjectView } from '@/data/projects'
import { SERVICES, PROCESS } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { profile } from '@/data/profile'
import { CASE_PAGES, CASE_SITES, casePath, type CasePageId } from '@/data/cases/pages'
import { SAMPLE_PROJECTS } from './samples'

/**
 * What Lumen knows about the page the visitor has open, so "what's on this
 * page?" and "tell me about this one" have an answer. The widget sends its
 * pathname and hash; on a case-study or write-up page, the embedded widget
 * sends that page's path. Only a page listed here is believed, and a hidden
 * page never is. Server-only: it is never shipped to the browser.
 */

/** `about` is the note Claude reads; `say`, when there is one, is how the offline answer tells a visitor what the page is. */
export type Page = { path: string; name: string; about: string; say?: string }

const first = profile.name.split(' ')[0]
const label = (href: string) => NAV.find((n) => n.href === href)?.label ?? href

const BASE: Record<string, string> = {
  '/': `The overview: ${home.lede} Cards lead to ${first}'s projects, services and background, with the tools he works with.`,
  '/projects': `${projects.lede} The cards: ${[{ title: projects.caseStudy.cardTitle }, projects.cards.automations, projects.cards.plan, projects.cards.sites, projects.cards.agents, ...projects.writeups].map((c) => c.title).join(', ')}.`,
  '/services': `The six services (${SERVICES.map((s) => s.name).join(', ')}) and the five steps every project runs through (${PROCESS.map((s) => s.name).join(', ')}).`,
  '/about': `${first}'s background: who he is, the roles he works in, where he's based, his stack and his courses.`,
  '/notes': `${notesPage.lede} Guides for business owners on automations, AI chatbots and web apps.`,
  '/contact': `The contact form and the common questions: ${FAQS.map((f) => f.q).join(' ')}`,
}

/** The Projects page's sub-views, each a card opened over the page (/projects#build-plan). */
const VIEWS: Record<ProjectView, { title: string; body: string }> = {
  'san-fernando': { title: projects.caseStudy.title, body: projects.caseStudy.body },
  automations: { title: projects.cards.automations.title, body: projects.cards.automations.body },
  'build-plan': { title: projects.cards.plan.title, body: projects.cards.plan.body },
  sites: { title: projects.cards.sites.title, body: projects.cards.sites.body },
  'ai-agents': { title: projects.cards.agents.title, body: projects.cards.agents.body },
  ...Object.fromEntries(projects.writeups.map((w) => [w.view, { title: w.title, body: w.desc }])),
} as Record<ProjectView, { title: string; body: string }>

/** The standalone write-ups the Projects cards open (/ai-agents.html and the rest). */
const WRITEUPS: Record<string, { title: string; body: string }> = Object.fromEntries([
  [projects.cards.automations.page, { title: projects.cards.automations.title, body: projects.cards.automations.body }],
  [projects.cards.plan.page, { title: projects.cards.plan.title, body: projects.cards.plan.body }],
  [projects.cards.agents.page, { title: projects.cards.agents.title, body: projects.cards.agents.body }],
  ...projects.writeups.map((w) => [w.page, { title: w.title, body: w.desc }]),
])

/** What each of a sample's case-study pages shows. */
const CASE_ABOUT: Record<CasePageId, string> = {
  automation: 'the automation flows behind its forms, step by step',
  'build-plan': 'one of its automations planned end to end, before it is built',
  'agentic-framework': 'the tools, rules and loop used to build it with AI',
  'end-to-end': 'every trigger, node, skill and agent behind it, wired as one live graph',
  'ai-agents': 'its RAG chatbots and AI agents, and how each one works',
}

/** Every case-study page, by its path. */
const CASES: Record<string, Page> = Object.fromEntries(
  SAMPLE_PROJECTS.filter((p) => CASE_SITES.includes(p.key)).flatMap((p) =>
    CASE_PAGES.map((c) => {
      const path = casePath(p.key, c.file)
      const about = `A case-study page for **${p.name}**, a sample system for a fictional ${p.trade} (a sample, not a client). It shows ${CASE_ABOUT[c.id]}. Its AI agents: ${p.builds.join(', ') || 'none'}. Its flows: ${p.flows.join(', ') || 'none'}. Its sample site is ${p.site}.`
      const builds = p.builds.length ? ` Its agents are the ${p.builds.slice(0, -1).join(', ')}${p.builds.length > 1 ? ' and ' : ''}${p.builds.at(-1)}.` : ''
      const say = `**${p.name}** is a sample system ${first} built for a fictional ${p.trade}, and this page shows ${CASE_ABOUT[c.id]}.${builds} You can also see [the ${p.name} site](${p.site}) itself.`
      return [path, { path, name: `${p.name}'s ${c.label} page`, about, say }]
    }),
  ),
)

/** The page a request names, or null when it names none this site shows. */
export function pageFor(raw: unknown): Page | null {
  if (typeof raw !== 'string' || raw.length > 200) return null
  const [path, hash = ''] = raw.split('#')
  if (CASES[path]) return CASES[path]
  if (WRITEUPS[path]) return { path, name: `the ${WRITEUPS[path].title} page`, about: `${WRITEUPS[path].body} It's one of the write-ups the Projects page opens.` }
  if (!(path in BASE) || isHidden(path)) return null
  const view = path === '/projects' ? VIEWS[hash as ProjectView] : undefined
  if (view) return { path: `${path}#${hash}`, name: `${label(path)}, with "${view.title}" open`, about: `${view.body} It's a card on the Projects page, opened over it.` }
  return { path, name: label(path), about: BASE[path] }
}
