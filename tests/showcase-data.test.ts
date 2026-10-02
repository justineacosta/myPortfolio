import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agents } from '@/data/agents'
import { automations } from '@/data/automations'
import { BUSINESSES, FACTS, showcase } from '@/data/showcase'

const file = (href: string) => `public${href.split('#')[0]}`

describe('the Showcase businesses', () => {
  it('are the four Automations businesses, in its tab order', () => {
    expect(BUSINESSES.map((b) => b.code)).toEqual(['HP-01', 'WM-01', 'ME-01', 'MW-01'])
    expect(BUSINESSES.map((b) => b.short)).toEqual(['Harbor & Pine', 'Westmere', 'Meridian Energy', 'Meridian Werks'])
    expect(BUSINESSES.map((b) => b.name)).toEqual(['Harbor & Pine Moving Co.', 'Westmere', 'Meridian Energy Infrastructure', 'Meridian Werks'])
    expect(BUSINESSES.map((b) => b.trade)).toEqual(['moving company', 'residential developer', 'commercial solar', 'automotive workshop'])
    expect(BUSINESSES.map((b) => b.platform)).toEqual(['n8n', 'n8n', 'make', 'zapier'])
  })

  it('joins each one’s site, flow and agents from the data that already exists', () => {
    for (const b of BUSINESSES) {
      expect(b.flow).toBe(automations.flows.find((f) => f.code === b.code))
      expect(b.src).toBe(b.flow.href)
      expect(b.builds).toEqual(agents.builds.filter((x) => x.business.name === b.name))
      expect(b.builds.length, b.code).toBeGreaterThan(0)
      expect(b.line.length, b.code).toBeGreaterThan(30)
    }
  })

  it('lists what was built: the site, the flow on its platform, then each agent or bot', () => {
    expect(BUSINESSES[0].built).toEqual([
      { label: 'The site', href: '/samples/harbor-and-pine-moving.html' },
      { label: 'Moving estimate · n8n', href: '/automations.html#hp-01' },
      { label: 'Help-desk RAG bot', href: '/ai-agents.html#build-helpdesk' },
      { label: 'Billing follow-up agent', href: '/ai-agents.html#build-billing' },
    ])
    expect(BUSINESSES[3].built[1]).toEqual({ label: 'Service booking · Zapier', href: '/automations.html#mw-01' })
  })

  it('links only to files that exist, and anchors that exist in them', () => {
    for (const b of BUSINESSES) {
      expect(existsSync(`public${b.tall}`), b.tall).toBe(true)
      for (const { href } of b.built) {
        expect(existsSync(file(href)), href).toBe(true)
        const hash = href.split('#')[1]
        if (hash) expect(readFileSync(file(href), 'utf8'), href).toContain(`id="${hash}"`)
      }
    }
  })
})

describe('the Showcase facts', () => {
  it('count the four builds', () => {
    expect(FACTS).toEqual([
      { n: 4, label: 'sample sites' },
      { n: 4, label: 'live flows' },
      { n: 24, label: 'flow steps' },
      { n: 7, label: 'agents and bots' },
      { n: 12, label: 'tools' },
    ])
  })

  it('agree with the source data counted another way', () => {
    expect(FACTS[2].n).toBe(automations.flows.reduce((n, f) => n + f.nodes.length, 0))
    expect(FACTS[3].n).toBe(agents.builds.filter((b) => b.business.name !== 'Ironline Utility Infrastructure').length)
  })
})

describe('the Showcase copy', () => {
  it('has no placeholder left', () => {
    expect(readFileSync('data/showcase.ts', 'utf8')).not.toMatch(/PLACEHOLDER/)
    expect(showcase.title).toEqual(['Four businesses,', 'built end to end.'])
    expect(showcase.sample).toBe('Sample builds for fictional businesses, not client projects.')
  })
})
