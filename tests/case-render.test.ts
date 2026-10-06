import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agenticFramework } from '@/data/agenticFramework'
import { agents } from '@/data/agents'
import { automations } from '@/data/automations'
import { plan } from '@/data/buildPlan'
import { endToEnd } from '@/data/endToEnd'
import { renderAgenticFramework } from '@/lib/agenticFramework/render'
import { renderAgents } from '@/lib/agents/render'
import { renderAutomations } from '@/lib/automations/render'
import type { SiteLink } from '@/lib/brand/render'
import { renderPlan } from '@/lib/buildPlan/render'
import { renderEndToEnd } from '@/lib/endToEnd/render'

type Row = [name: string, render: (site?: SiteLink) => string, file: string]

const rows: Row[] = [
  ['Automation', (site) => renderAutomations(site ? { ...automations, site } : undefined), 'public/automations.html'],
  ['Build plan', (site) => renderPlan(site ? { ...plan, site } : undefined), 'public/build-plan.html'],
  ['Agentic framework', (site) => renderAgenticFramework(site ? { ...agenticFramework, site } : undefined), 'public/agentic-framework.html'],
  ['End-to-end', (site) => renderEndToEnd(site ? { ...endToEnd, site } : undefined), 'public/end-to-end.html'],
  ['AI agents', (site) => renderAgents(site ? { ...agents, site } : undefined), 'public/ai-agents.html'],
]

const site: SiteLink = { name: 'Oriel', href: '/samples/oriel-portugal-residences.html', page: '/cases/oriel-portugal-residences/x.html' }

describe.each(rows)('%s page, site link', (_name, render, file) => {
  it('without a site, renders the committed general page byte for byte', () => {
    expect(render()).toBe(readFileSync(file, 'utf8').replace(/\r/g, ''))
  })

  it('with a site, links back to it and points canonical at its own page', () => {
    const doc = new DOMParser().parseFromString(render(site), 'text/html')
    const back = doc.querySelector('a.site-home')!
    expect(back.textContent).toBe('← Oriel site')
    expect(back.getAttribute('href')).toBe(site.href)
    expect(back.getAttribute('target')).toBe('_top')
    expect(doc.querySelector('a.home')).not.toBeNull()
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe(site.page)
  })

  it('escapes the site name', () => {
    expect(render({ ...site, name: 'A & <B>' })).toContain('A &amp; &lt;B&gt;')
  })
})

describe('Automation page, flow tabs', () => {
  const tabs = (html: string) => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('[role=tab] .tab-site')].map((t) => t.textContent)

  it('on the general page, each tab names its flow’s site', () => {
    expect(tabs(renderAutomations())).toEqual(automations.flows.map((f) => f.site))
  })

  it('on a site’s own page, each tab names its flow, since every flow shares the site', () => {
    expect(tabs(renderAutomations({ ...automations, site }))).toEqual(automations.flows.map((f) => f.title))
  })
})

describe('Build plan page, workflow platform', () => {
  it('plan: a workflow with a platform shows its logo and name on its section and canvas', () => {
    const [first, ...rest] = plan.workflows
    const doc = new DOMParser().parseFromString(renderPlan({ ...plan, workflows: [{ ...first, platform: 'make' }, ...rest] }), 'text/html')
    const id = first.code.toLowerCase()
    for (const where of [`section#${id} .shead`, `section#${id} figcaption`]) {
      const chip = doc.querySelector(`${where} .platform`)!
      expect(chip.textContent).toBe('Make')
      expect(chip.querySelector('svg')).not.toBeNull()
    }
    // The logo points at a symbol on the page, and the chip's style ships with it.
    expect(doc.querySelector('symbol#logo-make')).not.toBeNull()
    expect(doc.querySelector('style')!.textContent).toContain('.platform{')
    // Only the workflow that names a platform shows one.
    expect(doc.querySelectorAll('.platform')).toHaveLength(2)
  })

  it('plan: a workflow without a platform shows none', () => {
    const doc = new DOMParser().parseFromString(readFileSync('public/build-plan.html', 'utf8'), 'text/html')
    expect(doc.querySelector('.platform')).toBeNull()
  })
})
