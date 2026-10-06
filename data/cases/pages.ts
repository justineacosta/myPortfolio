/**
 * The pages each sample site can have, and which sites have them. Light on
 * purpose: SitePreview (a client component) imports this file, so it must
 * never import index.ts or any content, or every site's content would ship to
 * every visitor. tests/cases-data.test.ts holds it to that.
 */
export type CasePageId = 'automation' | 'build-plan' | 'agentic-framework' | 'end-to-end' | 'ai-agents'

/** The five pages, in tab order. `file` is the name inside /cases/<site>/. */
export const CASE_PAGES: { id: CasePageId; label: string; file: string }[] = [
  { id: 'automation', label: 'Automation', file: 'automation.html' },
  { id: 'build-plan', label: 'Build plan', file: 'build-plan.html' },
  { id: 'agentic-framework', label: 'Framework', file: 'agentic-framework.html' },
  { id: 'end-to-end', label: 'End-to-end', file: 'end-to-end.html' },
  { id: 'ai-agents', label: 'AI agents', file: 'ai-agents.html' },
]

/** The sites that have case pages, by folder key (the site's file name without .html). Kept equal to the keys of CASES by a test. */
export const CASE_SITES: string[] = ['oriel-portugal-residences', 'tidewell-vacation-rentals', 'altitude-personal-training', 'range-physical-therapy', 'riverdale-and-brooks', 'ostler-barbers', 'harbor-and-pine-moving', 'westmere-los-angeles', 'ironline-utility-infrastructure']

export const casePath = (key: string, file: string) => `/cases/${key}/${file}`

/** The case pages to offer for a sample site, or none when it has no case. */
export function casePagesFor(siteFile: string): { id: CasePageId; label: string; src: string }[] {
  const key = siteFile.replace(/\.html$/, '')
  if (!CASE_SITES.includes(key)) return []
  return CASE_PAGES.map((p) => ({ id: p.id, label: p.label, src: casePath(key, p.file) }))
}
