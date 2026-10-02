import { agents, type Build } from './agents'
import { automations, PLATFORMS, type Flow, type Platform } from './automations'
import { projects } from './projects'
import type { ToolId } from '../lib/brand/tools'

/**
 * /showcase: the four sample businesses, each built end to end: its site, the
 * flow behind its form (data/automations.ts) and its agents and bots
 * (data/agents.ts). All but the one line per business is joined from those
 * files and the site list (data/projects.ts), so nothing is typed twice.
 */
export type Link = { label: string; href: string }
export type Business = { code: string; short: string; name: string; trade: string; line: string; src: string; tall: string; platform: Platform; flow: Flow; builds: Build[]; built: Link[] }
export type Fact = { n: number; label: string }

export const showcase = {
  title: ['Four businesses,', 'built end to end.'] as const,
  lede: 'A site, the flow behind its form, and the agents that answer for it, for each of four sample businesses.',
  sample: 'Sample builds for fictional businesses, not client projects.',
  flagship: {
    tabsLabel: 'Sample builds',
    eyebrow: 'SAMPLE BUILD',
    built: 'What I built',
    siteLine: 'The site',
    open: 'Open the site',
    /** The clock's own pause, so a reader can stop the swap (WCAG 2.2.2). */
    pause: 'Pause',
    play: 'Play',
    pauseLabel: 'Pause the sample builds',
    playLabel: 'Play the sample builds',
    /** How long each business shows; the site shot scrolls top to bottom in the same time. */
    ms: 6000,
  },
  facts: { title: 'What’s in the four builds' },
}

/** The size of every tall site shot (scripts/make-thumbs.mjs, 1080×5760 at 0.6×). */
export const TALL = { width: 648, height: 3456 }

/** The one new line per business, by flow code. */
const LINES: Record<string, string> = {
  'HP-01': 'Professional movers on the Tidewater Coast, quoting homes and offices.',
  'WM-01': 'A residential developer selling a small set of Los Angeles homes.',
  'ME-01': 'A commercial solar company that surveys sites before it installs.',
  'MW-01': 'An automotive workshop that takes its service bookings online.',
}

export const BUSINESSES: Business[] = automations.flows.map((flow) => {
  const site = projects.sitesView.sites.find((s) => s.src === flow.href)!
  const builds = agents.builds.filter((b) => b.business.name === site.name)
  return {
    code: flow.code,
    short: flow.site,
    name: site.name,
    trade: builds[0].business.trade,
    line: LINES[flow.code],
    src: site.src,
    tall: site.tall,
    platform: flow.platform,
    flow,
    builds,
    built: [
      { label: showcase.flagship.siteLine, href: site.src },
      { label: `${flow.title} · ${PLATFORMS[flow.platform].name}`, href: `/automations.html#${flow.code.toLowerCase()}` },
      ...builds.map((b) => ({ label: b.name, href: `/ai-agents.html#build-${b.id}` })),
    ],
  }
})

const tools = new Set<ToolId>(BUSINESSES.flatMap((b) => [PLATFORMS[b.platform].tool, ...b.flow.nodes.flatMap((n) => n.tools), ...b.builds.flatMap((x) => x.tools)]))

export const FACTS: Fact[] = [
  { n: new Set(BUSINESSES.map((b) => b.src)).size, label: 'sample sites' },
  { n: BUSINESSES.length, label: 'live flows' },
  { n: BUSINESSES.reduce((n, b) => n + b.flow.nodes.length, 0), label: 'flow steps' },
  { n: BUSINESSES.reduce((n, b) => n + b.builds.length, 0), label: 'agents and bots' },
  { n: tools.size, label: 'tools' },
]
