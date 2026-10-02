import { about, ROLES } from '@/data/about'
import { agents } from '@/data/agents'
import { FACTS } from '@/data/assistantFacts'
import { automations, PLATFORMS } from '@/data/automations'
import { contact } from '@/data/contact'
import { FAQS } from '@/data/faqs'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { PROCESS, SERVICES, servicesPage } from '@/data/services'
import { BUSINESSES, showcase } from '@/data/showcase'
import { EXPERIMENTAL, TOOLS } from '@/data/stack'
import { CLIENTS } from '@/data/testimonials'
import { TOOLS as BRAND_TOOLS } from '@/lib/brand/tools'
import { clean, siteLinks } from '@/lib/assistant/source'

/** What the assistant knows. The site's is compiled from the data files; a sample-business demo can bring its own (spec §3.2). */
export interface Knowledge {
  text(): string
}

/** The lines that have content. */
const lines = (...l: (string | false | undefined | null)[]) => l.filter((x): x is string => Boolean(x))

/**
 * The knowledge document: one Markdown section per part of the site, each naming its page and link. Uncached, so it reads which
 * pages are switched off (data/nav.ts) at call time. A page that is off has no section and no link, and the only links are commands().
 */
export function buildKnowledge(): string {
  const { ref } = siteLinks()
  /** `See also:` line for a link that may be off. */
  const see = (href: string, what = 'See also') => (ref(href) ? `${what}: ${ref(href)}` : '')
  /** A section, dropped when its page is switched off or it has nothing to say. */
  const section = (heading: string, href: string, ...body: string[]) => {
    const page = ref(href)
    const text = body.filter(Boolean).join('\n')
    return page && text ? `## ${heading}\nPage: ${page}\n${text}` : ''
  }

  const toolNames = (ids: (keyof typeof BRAND_TOOLS)[]) => ids.map((id) => BRAND_TOOLS[id].name).join(', ')
  const sites = projects.sitesView.sites.map((s) => s.name)
  const c = projects.cards
  const buildLine = (b: (typeof agents.builds)[number]) =>
    lines(
      `- ${b.name} (${agents.buildText.kinds[b.kind]}, a sample build for ${b.business.name}, a fictional ${b.business.trade}): ${b.line}`,
      `  Example, ${agents.buildText.example[b.kind][0].toLowerCase()}: ${b.example.ask}`,
      `  Example, ${agents.buildText.example[b.kind][1].toLowerCase()}: ${b.example.answer}`,
      `  Tools: ${toolNames(b.tools)}. Route: ${b.caption}`,
    ).join('\n')

  const sections = [
    section(
      'Justine Acosta and Kraft',
      '/',
      ...lines(
        `Name: ${profile.name}`,
        `Studio: ${profile.studio}`,
        `Role: ${profile.jobTitle}`,
        `Location: ${about.location.title.replace(/^Based in /, '')}`,
        `Time zone: ${profile.tzLabel} (${profile.timezone})`,
        `Availability: ${profile.availability.label}, with working hours that overlap ${profile.availability.regions.join(', ')} schedules`,
        'Text taken from the site is written in Justine’s own voice: “I” and “my” mean Justine.',
        'The sample sites, flows, agents and chatbots on the site are sample builds for fictional businesses, not client projects.',
      ),
    ),

    section(
      'Services',
      '/services',
      servicesPage.title.join(' '),
      servicesPage.lede,
      ...SERVICES.map((s) => lines(`### ${s.n} ${s.name}`, s.line, ...s.bullets.map((b) => `- ${b}`), `Typical tools: ${s.tags.join(', ')}`, `Often paired with: ${s.logos.map((l) => l.name).join(', ')}`).join('\n')),
    ),

    section(
      servicesPage.method.label,
      `/services#${servicesPage.method.id}`,
      servicesPage.method.body,
      ...PROCESS.map((p) => `- ${p.n} (step ${p.key}), ${p.name}: ${p.line} Covers: ${p.items.join(', ')}.`),
    ),

    section(
      servicesPage.automation.label,
      `/services#${servicesPage.automation.id}`,
      `${automations.heading}. ${automations.lede}`,
      automations.sample,
      ...automations.flows.map((f) =>
        lines(
          `### ${f.title} flow for ${f.site} (${f.code}, on ${PLATFORMS[f.platform].name})`,
          f.outcome,
          ...f.nodes.map((n) => `- ${n.label} (${n.sub}): ${n.what} ${n.why}`),
        ).join('\n'),
      ),
      see('/projects#automations', 'The same flows also open on the Projects board'),
    ),

    section(
      'Projects',
      '/projects',
      projects.title.join(' '),
      projects.lede,
      `### ${c.automations.title}`,
      c.automations.body,
      see('/projects#automations'),
      `### ${c.plan.title}`,
      `${c.plan.body} ${c.plan.heading} The plan runs ${c.plan.steps.map((s) => s.label).join(', then ')}.`,
      see('/projects#build-plan'),
      `### ${c.sites.title}`,
      `${c.sites.body} The sample sites are ${sites.join(', ')}. They are sample builds for fictional businesses.`,
      see('/projects#sites'),
      `### ${c.agents.title}`,
      `${c.agents.body} ${c.agents.counts.map((n) => n.name).join(' and ')}. Tools used: ${c.agents.tools.map((t) => t.name).join(', ')}.`,
      see('/projects#ai-agents'),
      ...projects.writeups.map((w) => lines(`### ${w.title}`, w.desc, `Tools: ${w.logos.map((l) => l.name).join(', ')}`, see(`/projects#${w.view}`)).join('\n')),
    ),

    section(
      c.agents.title,
      '/projects#ai-agents',
      `${agents.heading}. ${agents.lede}`,
      `${agents.sample} Prices and figures inside the examples belong to the fictional businesses, not to Justine.`,
      '### At a glance',
      ...agents.glance.map((t) => `- ${t.title}: ${t.text}`),
      '### How a RAG chatbot works',
      agents.diagrams.rag.caption,
      ...agents.diagrams.rag.steps.map((s) => `- ${s.label} (${s.sub}): ${s.what}`),
      '### How an agent works',
      agents.diagrams.agent.caption,
      ...agents.diagrams.agent.steps.map((s) => `- ${s.label} (${s.sub}): ${s.what}`),
      '### The eight sample builds',
      ...agents.builds.map(buildLine),
      '### Guardrails',
      ...agents.guardrails.map((g) => `- ${g.title}: ${g.text}`),
      '### Plain-English glossary',
      ...agents.glossary.map(([term, def]) => `- ${term}: ${def}`),
    ),

    section(
      'Showcase',
      '/showcase',
      showcase.title.join(' '),
      showcase.lede,
      showcase.sample,
      ...BUSINESSES.map((b) =>
        lines(`### ${b.name} (${b.trade})`, b.line, `Flow: ${b.flow.title} on ${PLATFORMS[b.platform].name}. Agents and bots: ${b.builds.map((x) => x.name).join(', ')}.`).join('\n'),
      ),
    ),

    section(
      'The stack',
      '/',
      `Tools Justine works with: ${TOOLS.map((t) => t.name).join(', ')}.`,
      `Still being tested, not yet daily tools: ${EXPERIMENTAL.join(', ')}.`,
    ),

    section(
      'About Justine',
      '/about',
      `${about.title.join(' ')} ${about.lede}`,
      `${about.intro.heading} ${about.intro.aside}`,
      `${about.intro.lead}${about.intro.body}`,
      about.intro.story,
      '### Roles',
      ...ROLES.map((r) => `- ${r.name}: ${r.line} Tools: ${r.logos.map((l) => l.name).join(', ')}.`),
      `### Location\n${about.location.title}. ${about.location.detail.replace(/ · /g, ', ')}.`,
    ),

    section(
      'Justine’s background and career',
      '/about',
      'Justine uses he/him.',
      '### Career, newest first',
      ...FACTS.career.map((j) => `- ${j.role}, ${j.org} (${j.where}), ${j.when}. ${j.did}`),
      '### Education',
      `${FACTS.education.degree}, ${FACTS.education.school} (${FACTS.education.where}), ${FACTS.education.when}. ${FACTS.education.did}`,
      '### Background',
      `${FACTS.background.languages} ${FACTS.background.start} ${FACTS.background.interests}`,
    ),

    section(
      'Working with Justine',
      '/contact',
      `- Billing: ${FACTS.working.billing}`,
      `- Ownership: ${FACTS.working.ownership}`,
      `- Communication: ${FACTS.working.communication}`,
      `- Design: ${FACTS.working.design}`,
      `- Teams: ${FACTS.working.team}`,
    ),

    section(
      'What Justine believes',
      '/about',
      ...FACTS.beliefs.map((b) => `- ${b}`),
      `In his own words: “${FACTS.ownWords}”`,
    ),

    section(
      'Testimonials',
      '/testimonials',
      ...CLIENTS.map((cl) => (clean(cl.name) && clean(cl.quote) ? `- ${cl.name}, ${clean(cl.role)}: “${cl.quote}”` : '')),
    ),

    section(
      contact.faqs.label,
      `/contact#${contact.faqs.id}`,
      ...FAQS.map((f) => `### ${f.q}\n${f.a}`),
    ),

    section(
      'Contact and starting a project',
      '/contact',
      contact.title.join(' '),
      contact.lede,
      `The Contact page has a form that asks for a first name, last name, email and what the visitor is running into. ${contact.note}`,
      `After a message arrives: ${contact.reply.steps.join(' ')}`,
      'Justine is also on LinkedIn, linked from the Contact page.',
      `Hours covered: ${profile.tzLabel}, overlapping ${profile.availability.regions.join(', ')} schedules.`,
    ),
  ]

  return ['# Knowledge about Justine Acosta’s portfolio', ...sections.filter(Boolean)].join('\n\n')
}

let built: string | undefined

/** The site's knowledge, built once per server instance (the pages switched off are fixed per deploy). */
export const siteKnowledge: Knowledge = { text: () => (built ??= buildKnowledge()) }
