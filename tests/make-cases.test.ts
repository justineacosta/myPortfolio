import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agenticFramework } from '@/data/agenticFramework'
import { agents } from '@/data/agents'
import { automations } from '@/data/automations'
import { plan } from '@/data/buildPlan'
import { CASES, withSite, type CaseSet } from '@/data/cases'
import { CASE_PAGES, casePath } from '@/data/cases/pages'
import { endToEnd } from '@/data/endToEnd'
import { renderCases } from '@/lib/cases/render'
import { withLumen } from '@/lib/chat/embed'

// Each of the first two tests renders every case page, which grows with each site; under the full suite’s load that outruns the default five seconds.
const ALL_PAGES = { timeout: 30_000 }

describe('renderCases', () => {
  it('writes every page each case has, and the committed files are up to date', ALL_PAGES, () => {
    for (const { path, html } of renderCases()) expect(readFileSync(`public${path}`, 'utf8').replace(/\r/g, ''), path).toBe(withLumen(html))
  })

  it('resolves every in-page link on every case page', ALL_PAGES, () => {
    for (const { path, html } of renderCases()) {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const hrefs = [...doc.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!)
      for (const href of hrefs) if (href !== '#') expect(doc.getElementById(decodeURIComponent(href.slice(1))), `${path}: ${href}`).not.toBeNull()
    }
  })

  it('maps CASE_PAGES ids to the five renderers', () => {
    const key = 'oriel-portugal-residences'
    const fake: Record<string, CaseSet> = {
      [key]: {
        automation: withSite(automations, key, 'automation'),
        plan: withSite(plan, key, 'build-plan'),
        framework: withSite(agenticFramework, key, 'agentic-framework'),
        endToEnd: withSite(endToEnd, key, 'end-to-end'),
        agents: withSite(agents, key, 'ai-agents'),
      },
    }
    const out = renderCases(fake)
    expect(out.map((o) => o.path)).toEqual(CASE_PAGES.map((p) => casePath(key, p.file)))
    for (const { path, html } of out) {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href'), path).toBe(path)
      expect(doc.querySelector('a.site-home')!.getAttribute('href'), path).toBe('/samples/oriel-portugal-residences.html')
    }
  })

  it('renders a case with only some pages, and nothing for no cases', () => {
    const key = 'oriel-portugal-residences'
    expect(renderCases({ [key]: { endToEnd: withSite(endToEnd, key, 'end-to-end') } }).map((o) => o.path)).toEqual([casePath(key, 'end-to-end.html')])
    expect(renderCases({})).toEqual([])
    expect(CASES).toBeDefined()
  })
})
