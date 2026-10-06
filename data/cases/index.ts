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
import tidewellAutomation from './tidewell-vacation-rentals/automation.ts'
import tidewellPlan from './tidewell-vacation-rentals/buildPlan.ts'
import tidewellAgents from './tidewell-vacation-rentals/agents.ts'
import tidewellEndToEnd from './tidewell-vacation-rentals/endToEnd.ts'
import tidewellFramework from './tidewell-vacation-rentals/agenticFramework.ts'
import altitudeAutomation from './altitude-personal-training/automation.ts'
import altitudePlan from './altitude-personal-training/buildPlan.ts'
import altitudeAgents from './altitude-personal-training/agents.ts'
import altitudeEndToEnd from './altitude-personal-training/endToEnd.ts'
import altitudeFramework from './altitude-personal-training/agenticFramework.ts'
import rangeAutomation from './range-physical-therapy/automation.ts'
import rangePlan from './range-physical-therapy/buildPlan.ts'
import rangeAgents from './range-physical-therapy/agents.ts'
import rangeEndToEnd from './range-physical-therapy/endToEnd.ts'
import rangeFramework from './range-physical-therapy/agenticFramework.ts'
import riverdaleAutomation from './riverdale-and-brooks/automation.ts'
import riverdalePlan from './riverdale-and-brooks/buildPlan.ts'
import riverdaleAgents from './riverdale-and-brooks/agents.ts'
import riverdaleEndToEnd from './riverdale-and-brooks/endToEnd.ts'
import riverdaleFramework from './riverdale-and-brooks/agenticFramework.ts'
import ostlerAutomation from './ostler-barbers/automation.ts'
import ostlerPlan from './ostler-barbers/buildPlan.ts'
import ostlerAgents from './ostler-barbers/agents.ts'
import ostlerEndToEnd from './ostler-barbers/endToEnd.ts'
import ostlerFramework from './ostler-barbers/agenticFramework.ts'
import harborAutomation from './harbor-and-pine-moving/automation.ts'
import harborPlan from './harbor-and-pine-moving/buildPlan.ts'

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
  'tidewell-vacation-rentals': {
    automation: withSite(tidewellAutomation, 'tidewell-vacation-rentals', 'automation'),
    plan: withSite(tidewellPlan, 'tidewell-vacation-rentals', 'build-plan'),
    agents: withSite(tidewellAgents, 'tidewell-vacation-rentals', 'ai-agents'),
    endToEnd: withSite(tidewellEndToEnd, 'tidewell-vacation-rentals', 'end-to-end'),
    framework: withSite(tidewellFramework, 'tidewell-vacation-rentals', 'agentic-framework'),
  },
  'altitude-personal-training': {
    automation: withSite(altitudeAutomation, 'altitude-personal-training', 'automation'),
    plan: withSite(altitudePlan, 'altitude-personal-training', 'build-plan'),
    agents: withSite(altitudeAgents, 'altitude-personal-training', 'ai-agents'),
    endToEnd: withSite(altitudeEndToEnd, 'altitude-personal-training', 'end-to-end'),
    framework: withSite(altitudeFramework, 'altitude-personal-training', 'agentic-framework'),
  },
  'range-physical-therapy': {
    automation: withSite(rangeAutomation, 'range-physical-therapy', 'automation'),
    plan: withSite(rangePlan, 'range-physical-therapy', 'build-plan'),
    agents: withSite(rangeAgents, 'range-physical-therapy', 'ai-agents'),
    endToEnd: withSite(rangeEndToEnd, 'range-physical-therapy', 'end-to-end'),
    framework: withSite(rangeFramework, 'range-physical-therapy', 'agentic-framework'),
  },
  'riverdale-and-brooks': {
    automation: withSite(riverdaleAutomation, 'riverdale-and-brooks', 'automation'),
    plan: withSite(riverdalePlan, 'riverdale-and-brooks', 'build-plan'),
    agents: withSite(riverdaleAgents, 'riverdale-and-brooks', 'ai-agents'),
    endToEnd: withSite(riverdaleEndToEnd, 'riverdale-and-brooks', 'end-to-end'),
    framework: withSite(riverdaleFramework, 'riverdale-and-brooks', 'agentic-framework'),
  },
  'ostler-barbers': {
    automation: withSite(ostlerAutomation, 'ostler-barbers', 'automation'),
    plan: withSite(ostlerPlan, 'ostler-barbers', 'build-plan'),
    agents: withSite(ostlerAgents, 'ostler-barbers', 'ai-agents'),
    endToEnd: withSite(ostlerEndToEnd, 'ostler-barbers', 'end-to-end'),
    framework: withSite(ostlerFramework, 'ostler-barbers', 'agentic-framework'),
  },
  'harbor-and-pine-moving': {
    automation: withSite(harborAutomation, 'harbor-and-pine-moving', 'automation'),
    plan: withSite(harborPlan, 'harbor-and-pine-moving', 'build-plan'),
  },
}

/** A page's content with its `site` link filled in: the sample site it belongs to, and its own path. */
export function withSite<T extends object>(content: T, key: string, page: CasePageId): T & { site: SiteLink } {
  const site = projects.sitesView.sites.find((s) => s.file === `${key}.html`)
  if (!site) throw new Error(`No sample site for the case "${key}"`)
  const file = CASE_PAGES.find((p) => p.id === page)!.file
  return { ...content, site: { name: site.name, href: site.src, page: casePath(key, file) } }
}
