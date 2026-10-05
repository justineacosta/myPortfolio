/**
 * Every sample site's case pages: its own copies of the five generated
 * standalone pages, written for that business. Heavy (all the content), so
 * only Node, the build script and tests import it. Client code imports
 * pages.ts. `npm run cases` renders each page into public/cases/<site>/.
 */
import type { AgenticFramework } from '../agenticFramework.ts'
import type { Agents } from '../agents.ts'
import type { Automations } from '../automations.ts'
import type { Plan } from '../buildPlan.ts'
import type { EndToEnd } from '../endToEnd.ts'
import { projects } from '../projects.ts'
import type { SiteLink } from '../../lib/brand/render.ts'
import { CASE_PAGES, casePath, type CasePageId } from './pages.ts'
import orielAutomation from './oriel-portugal-residences/automation.ts'
import orielPlan from './oriel-portugal-residences/buildPlan.ts'
import orielAgents from './oriel-portugal-residences/agents.ts'
import orielEndToEnd from './oriel-portugal-residences/endToEnd.ts'
import orielFramework from './oriel-portugal-residences/agenticFramework.ts'

/** The pages a site has; a site need not have all five. */
export type CaseSet = { automation?: Automations; plan?: Plan; framework?: AgenticFramework; endToEnd?: EndToEnd; agents?: Agents }

/** Keyed by folder: the site's file name without .html. */
export const CASES: Record<string, CaseSet> = {
  'oriel-portugal-residences': {
    automation: withSite(orielAutomation, 'oriel-portugal-residences', 'automation'),
    plan: withSite(orielPlan, 'oriel-portugal-residences', 'build-plan'),
    agents: withSite(orielAgents, 'oriel-portugal-residences', 'ai-agents'),
    endToEnd: withSite(orielEndToEnd, 'oriel-portugal-residences', 'end-to-end'),
    framework: withSite(orielFramework, 'oriel-portugal-residences', 'agentic-framework'),
  },
}

/** A page's content with its `site` link filled in: the sample site it belongs to, and its own path. */
export function withSite<T extends object>(content: T, key: string, page: CasePageId): T & { site: SiteLink } {
  const site = projects.sitesView.sites.find((s) => s.file === `${key}.html`)
  if (!site) throw new Error(`No sample site for the case "${key}"`)
  const file = CASE_PAGES.find((p) => p.id === page)!.file
  return { ...content, site: { name: site.name, href: site.src, page: casePath(key, file) } }
}
