import { projects } from '@/data/projects'
import { CASES } from '@/data/cases'
import { casePath } from '@/data/cases/pages'

/** What a project card shows. Sent to the browser, so it stays small. */
export type CardProject = { key: string; name: string; trade: string; thumb: string; href: string }

/** A sample system as Lumen knows it: the card, plus the names of what it runs. */
export type SampleProject = CardProject & { site: string; builds: string[]; flows: string[] }

/**
 * The portfolio's sample systems, in the sites carousel's order: each is a
 * fictional business with a full site, case pages, agents and flows. They
 * stand in for the old portfolio's projects in Lumen's replies and cards.
 * The key is the site's file name without .html, the slug a
 * `[[project:<key>]]` directive names. Server-only: CASES is every case's content.
 */
export const SAMPLE_PROJECTS: SampleProject[] = projects.sitesView.sites.map((site) => {
  const key = site.file.replace(/\.html$/, '')
  const set = CASES[key]
  const builds = set?.agents?.builds ?? []
  return {
    key,
    name: site.name,
    trade: builds[0]?.business.trade ?? '',
    thumb: site.thumb,
    href: casePath(key, 'ai-agents.html'),
    site: site.src,
    builds: builds.map((b) => b.name),
    flows: set?.automation?.flows.map((f) => f.title) ?? [],
  }
})

/** The cards the widget can draw, without the rest. */
export const CARD_PROJECTS: CardProject[] = SAMPLE_PROJECTS.map(({ key, name, trade, thumb, href }) => ({ key, name, trade, thumb, href }))
