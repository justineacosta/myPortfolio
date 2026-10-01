import { describe, expect, it } from 'vitest'
import { automations as g, PLATFORMS } from '@/data/automations'
import { renderAutomations } from '@/lib/automations/render'
import { automationsCss } from '@/lib/automations/styles'
import { themeHeadJs } from '@/lib/brand/render'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAutomations()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)
const lower = (code: string) => code.toLowerCase()

describe('renderAutomations', () => {
  it('picks its theme in <head>, before the styles', () => {
    const first = doc.head.querySelector('script, style')!
    expect(first.tagName).toBe('SCRIPT')
    expect(first.textContent).toBe(themeHeadJs())
  })

  it('opens with the title, the lede, the sample note and every tool, the three platforms first', () => {
    expect(doc.title).toBe('Automations · Justine Acosta')
    expect(doc.querySelector('h1')!.textContent).toBe(g.heading)
    expect(doc.querySelector('.kicker')!.textContent).toBe('AUTOMATIONS · FOUR LIVE FLOWS')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.sample-note')!.textContent).toBe(g.sample)
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['n8n', 'Make', 'Zapier', 'Claude', 'Telegram', 'Gmail', 'HubSpot', 'Google Sheets', 'Cal.com', 'Airtable'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/automations.html')
  })

  it('has one tab per flow, naming its site and platform, each controlling its panel', () => {
    const list = doc.querySelector('[role=tablist]')!
    expect(list.getAttribute('aria-label')).toBe('Flows')
    const tabs = [...list.querySelectorAll('[role=tab]')]
    expect(tabs.map((t) => t.textContent)).toEqual(g.flows.map((f) => `${f.site}${PLATFORMS[f.platform].name}`))
    tabs.forEach((t, i) => {
      const f = g.flows[i]
      expect(t.id).toBe(`tab-${lower(f.code)}`)
      expect(t.getAttribute('aria-controls')).toBe(lower(f.code))
      expect(t.getAttribute('aria-selected')).toBe(String(i === 0))
      expect(t.getAttribute('tabindex')).toBe(i === 0 ? '0' : '-1')
      const panel = doc.getElementById(lower(f.code))!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(t.id)
      expect(panel.hasAttribute('hidden')).toBe(i !== 0)
    })
  })

  it('draws each flow in its platform’s look, with a step button and a read-aloud step per node, and a link to its site', () => {
    for (const f of g.flows) {
      const panel = doc.getElementById(lower(f.code))!
      const fig = panel.querySelector('figure.canvas')!
      expect(fig.classList.contains(`p-${f.platform}`), f.code).toBe(true)
      expect(fig.querySelectorAll('button.node')).toHaveLength(f.nodes.length)
      expect(fig.querySelectorAll('.steps li')).toHaveLength(f.nodes.length)
      expect(fig.querySelectorAll('.run-dot').length).toBeGreaterThan(0)
      expect(panel.querySelector('.outcome')!.textContent).toBe(f.outcome)
      const site = panel.querySelector<HTMLAnchorElement>('a.site-link')!
      expect(site.getAttribute('href')).toBe(f.href)
      expect(site.getAttribute('target')).toBe('_blank')
    }
  })

  it('numbers the Zap’s steps, and only the Zap’s', () => {
    expect([...doc.querySelectorAll('#mw-01 .node-n')].map((n) => n.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(doc.querySelectorAll('.node-n')).toHaveLength(5)
  })

  it('gives every step a panel: its platform and kind, what it does, what it reads and why', () => {
    const d = data()
    expect(Object.keys(d)).toHaveLength(g.flows.reduce((n, f) => n + f.nodes.length, 0))
    expect(d['hp-01:hp-price']).toEqual({
      label: 'Price the move',
      type: 'n8n · Claude',
      what: g.flows[0].nodes[1].what,
      settings: [['What it reads', g.flows[0].nodes[1].reads.join(', ')], ['Why it’s here', g.flows[0].nodes[1].why]],
      tools: ['claude'],
    })
    expect(d['hp-01:hp-form'].tools).toBeUndefined()
    expect(doc.querySelector('[data-p=close]')!.getAttribute('aria-label')).toBe('Close details')
  })

  it('points every logo at the sheet, and links nowhere outside the site', () => {
    const ids = new Set([...doc.querySelectorAll('symbol')].map((s) => s.id))
    for (const u of doc.querySelectorAll('use')) expect(ids.has(u.getAttribute('href')!.slice(1)), u.getAttribute('href')!).toBe(true)
    for (const a of doc.querySelectorAll('a[href]')) expect(a.getAttribute('href')!, a.outerHTML).toMatch(/^[/#]/)
  })

  it('inlines the End-to-End client', () => {
    const scripts = [...doc.querySelectorAll('body script:not([type])')].map((s) => s.textContent!)
    expect(scripts.some((s) => s.includes('graph-nodes'))).toBe(true)
  })

  it('hides a flow the hidden attribute hides, though sections are grids', () => {
    expect(automationsCss({ dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() })).toContain('.flow[hidden]{display:none}')
  })
})
