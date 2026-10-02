import { about, ROLES } from '@/data/about'
import { agents } from '@/data/agents'
import { FACTS } from '@/data/assistantFacts'
import { automations, PLATFORMS } from '@/data/automations'
import { contact } from '@/data/contact'
import { FAQS } from '@/data/faqs'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { BUILDS, projects } from '@/data/projects'
import { PROCESS, SERVICES, servicesPage } from '@/data/services'
import { BUSINESSES, showcase } from '@/data/showcase'
import { EXPERIMENTAL, TOOLS } from '@/data/stack'
import { CLIENTS } from '@/data/testimonials'
import { clean, siteLinks } from '@/lib/assistant/source'

/**
 * One thing the site says, with where to read more: the unit the quick engine searches and answers from. `weight` (default 1) is how much a hit on it
 * counts in the search. `titleOnly` passages are found by their title alone: an overview, whose text lists the names of other passages.
 */
export type Passage = { id: string; title: string; text: string; href: string; label: string; weight?: number; titleOnly?: true }

/**
 * The weight of a passage that describes a piece of sample work (a Projects card or write-up, a sample build, a flow, a showcase business, a role).
 * Those share their words with the services they illustrate ("RAG chatbots", "n8n"), and are shorter, so unweighted they would outrank the FAQ,
 * service or page that answers the question itself.
 */
const SAMPLE = 0.5

/**
 * The weight of a page overview (Services, Projects, About). It is found by its title alone, often a word the sample passages also use
 * ("not client projects", "across this portfolio"), so it counts double for the question that names the page.
 */
const OVERVIEW = 2

/** Pieces of text joined by a space, the placeholders and empty ones left out. */
const words = (...parts: (string | undefined)[]) => parts.map(clean).filter(Boolean).join(' ')
/** The names in a list, comma-separated. */
const names = (list: { name: string }[]) => list.map((x) => x.name).join(', ')

/**
 * Every passage the site's own text gives (spec §4.1), from the same data files and the same rules as the knowledge document.
 * Uncached, so it reads which pages are switched off (data/nav.ts) at call time: a passage whose page is off is left out, and the
 * only links are commands().
 */
export function buildPassages(): Passage[] {
  const { page } = siteLinks()
  const out: Passage[] = []
  const add = (id: string, title: string, text: string, href: string, opts: { weight?: number; titleOnly?: true } = {}) => {
    const link = page(href)
    const t = clean(title)
    if (link && t && text) out.push({ id, title: t, text, href, label: link.label, ...opts })
  }
  const sample = (id: string, title: string, text: string, href: string) => add(id, title, text, href, { weight: SAMPLE })
  // What a page holds, for the questions that name the page rather than a thing on it ("what services do you offer", "who is Justine").
  // Found by its title only: its text names every service or build, and would otherwise outrank the passage about each one.
  const overview = (id: string, title: string, text: string, href: string) => add(id, title, text, href, { weight: OVERVIEW, titleOnly: true })

  FAQS.forEach((f, i) => add(`faq-${i + 1}`, f.q, words(f.a), `/contact#${contact.faqs.id}`))

  overview('services-overview', home.cards.services.title, words(`${servicesPage.offers.title}: ${SERVICES.map((s) => s.name).join(', ')}.`, servicesPage.lede), '/services')
  overview('projects-overview', home.cards.projects.title, words(home.cards.projects.body, `Builds: ${BUILDS.map((b) => b.name).join(', ')}.`), '/projects')
  overview('about-overview', about.title.join(' '), words(`${profile.name}, ${profile.jobTitle.toLowerCase()}.`, `${about.intro.lead}.`, `${about.location.title}.`), '/about')

  // A service's tags, then the tools its card's logos show ("Make" for automation). Unlabelled, so "what tools do you use" finds the stack, not a service.
  SERVICES.forEach((s, i) => add(`service-${i + 1}`, s.name, words(s.line, ...s.bullets.map((b) => `${b}.`), `${s.tags.join(', ')}.`, `${names(s.logos)}.`), '/services'))

  const method = `/services#${servicesPage.method.id}`
  add('method', servicesPage.method.label, words(servicesPage.method.body, PROCESS.map((p) => p.name).join(', ')), method)
  PROCESS.forEach((p, i) => add(`step-${i + 1}`, `${p.name} (${p.n})`, words(p.line, `Covers: ${p.items.join(', ')}.`), method))

  add('automation', servicesPage.automation.label, words(`${automations.heading}.`, automations.lede, automations.sample), `/services#${servicesPage.automation.id}`)

  const c = projects.cards
  sample('card-automations', c.automations.title, words(c.automations.body), '/projects#automations')
  // The build plan is a thing visitors ask about by name, so its card counts in full.
  add('card-plan', c.plan.title, words(c.plan.body, c.plan.heading, `Steps: ${c.plan.steps.map((s) => s.label).join(', ')}.`), '/projects#build-plan')
  sample('card-sites', c.sites.title, words(c.sites.body), '/projects#sites')
  sample('card-agents', c.agents.title, words(c.agents.body, `${c.agents.counts.map((n) => n.name).join(' and ')}.`), '/projects#ai-agents')
  for (const w of projects.writeups) sample(`writeup-${w.view}`, w.title, words(w.desc, `Tools: ${names(w.logos)}.`), `/projects#${w.view}`)
  sample('sites', projects.sitesView.listLabel, words(`${projects.sitesView.sites.map((s) => s.name).join(', ')}.`, agents.sample), '/projects#sites')
  for (const f of automations.flows) {
    sample(`flow-${f.code.toLowerCase()}`, `${f.title} · ${PLATFORMS[f.platform].name}`, words(`${f.site}.`, f.outcome, `${f.nodes.map((n) => n.label).join(', ')}.`, automations.sample), '/projects#automations')
  }
  for (const b of agents.builds) sample(`build-${b.id}`, b.name, words(b.line, agents.sample), '/projects#ai-agents')

  add('about-intro', about.intro.heading, words(about.lede, `${about.intro.lead}${about.intro.body}`, about.intro.story), '/about')
  add('about-location', about.location.title, words(`${about.location.detail.replace(/ · /g, ', ')}.`), '/about')
  ROLES.forEach((r, i) => sample(`role-${i + 1}`, r.name, words(r.line, `Tools: ${names(r.logos)}.`), '/about'))

  // What the assistant knows beyond the pages (data/assistantFacts.ts), titled the way visitors ask.
  const f = FACTS
  add('career', 'Career and work experience: where Justine has worked', f.career.map((j) => `${j.role}, ${j.org}, ${j.when}. ${j.did}`).join(' '), '/about')
  add('education', 'Education: Justine’s degree and university', `${f.education.degree}, ${f.education.school}, ${f.education.where}, ${f.education.when}. ${f.education.did}`, '/about')
  add('background', 'Languages Justine speaks, and how he started', `${f.background.languages} ${f.background.start}`, '/about')
  add('interests', 'Hobbies and interests: what Justine does for fun', f.background.interests, '/about')
  add('beliefs', 'Justine’s philosophy: what he believes', f.beliefs.join(' '), '/about')
  add('billing', 'Hourly or fixed price?', f.working.billing, '/contact')
  add('ownership', 'Who owns the code?', f.working.ownership, '/contact')
  add('communication', 'How Justine communicates with clients', f.working.communication, '/contact')
  add('design', 'Does Justine also design?', f.working.design, '/contact')
  add('team', 'Can Justine join an existing team?', f.working.team, '/contact')

  const inUse = TOOLS.filter((t) => !EXPERIMENTAL.includes(t.name))
  const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()
  add('stack', `${home.cards.stack.title}: ${home.tools.title}`, words(home.cards.stack.body, `${label(home.cards.stack.inUse)}: ${names(inUse)}.`, `${label(home.cards.stack.experimental)}: ${EXPERIMENTAL.join(', ')}.`), '/')

  sample('showcase', showcase.title.join(' '), words(showcase.lede, showcase.sample), '/showcase')
  for (const b of BUSINESSES) sample(`showcase-${b.code.toLowerCase()}`, `${b.name} (${b.trade})`, words(b.line, showcase.sample), '/showcase')

  CLIENTS.forEach((cl, i) => {
    if (clean(cl.name) && clean(cl.quote)) add(`testimonial-${i + 1}`, cl.name, words(`“${cl.quote}”`, clean(cl.role) && `${cl.role}.`), '/testimonials')
  })

  return out
}

let built: Passage[] | undefined

/** The site's passages, built once per server instance (the pages switched off are fixed per deploy). */
export const sitePassages = (): Passage[] => (built ??= buildPassages())
