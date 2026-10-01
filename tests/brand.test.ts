import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { glossaryLogo, logo, logoBadges, logoSheet, toolStrip, toolTemplates, toolsUsed } from '@/lib/brand/render'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

const IDS = Object.keys(TOOLS) as ToolId[]
const files = readdirSync('lib/brand/logos').filter((f) => f.endsWith('.svg'))
const parse = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

describe('the tools registry and its logo files', () => {
  it('has a logo file for every tool, a dark one where it says so, and no file it does not use', () => {
    const want = IDS.flatMap((id) => [`${id}.svg`, ...(TOOLS[id].dark ? [`${id}-dark.svg`] : [])])
    expect([...files].sort()).toEqual(want.sort())
  })

  it('knows the tools the Automations flows run on', () => {
    expect(IDS).toEqual(expect.arrayContaining(['hubspot', 'airtable', 'make', 'zapier']))
    expect(['hubspot', 'airtable', 'make', 'zapier'].map((id) => TOOLS[id as ToolId].name)).toEqual(['HubSpot', 'Airtable', 'Make', 'Zapier'])
  })

  it('credits every logo file', () => {
    const credits = readFileSync('lib/brand/logos/CREDITS.md', 'utf8')
    for (const f of files) expect(credits, f).toContain(`\`${f}\``)
  })

  it('names each tool once, in plain text, with a brand colour', () => {
    const names = IDS.map((id) => TOOLS[id].name)
    expect(new Set(names).size).toBe(names.length)
    for (const id of IDS) {
      expect(TOOLS[id].name, id).toMatch(/^[A-Za-z0-9 .]+$/)
      expect(TOOLS[id].brand, id).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('draws mono logos in the text colour only', () => {
    for (const id of IDS.filter((i) => TOOLS[i].mono)) {
      const svg = readFileSync(`lib/brand/logos/${id}.svg`, 'utf8')
      expect(svg, id).not.toMatch(/#[0-9a-f]{3,6}\b/i)
      expect(svg, id).toContain('currentColor')
    }
  })
})

describe('the logo sheet', () => {
  const sheet = logoSheet(['gmail', 'codex', 'telegram'])
  const doc = parse(sheet)

  it('holds each logo it is asked for once, plus Codex’s dark version', () => {
    expect([...doc.querySelectorAll('symbol')].map((s) => s.id)).toEqual(['logo-gmail', 'logo-codex', 'logo-codex-dark', 'logo-telegram'])
  })

  it('prefixes every id inside a logo, and every reference points at an id in the sheet', () => {
    const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids.filter((i) => !i.startsWith('logo-'))) expect(id).toMatch(/^lg-/)
    const refs = [...sheet.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map((m) => m[1] ?? m[2])
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) expect(ids, r).toContain(r)
  })

  it('is hidden from people and screen readers without display:none, so gradients still paint', () => {
    const svg = doc.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('style') ?? '').not.toMatch(/display:\s*none/)
  })

  it('stays small: every logo together is under 30 KB', () => {
    expect(logoSheet(IDS).length).toBeLessThan(30_000)
  })
})

describe('logos on the page', () => {
  it('points a logo at its symbol, at the size asked, hidden from screen readers', () => {
    const svg = parse(logo('n8n', 16)).querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('16')
    expect(svg.getAttribute('class')).toBe('logo')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.querySelector('use')!.getAttribute('href')).toBe('#logo-n8n')
  })

  it('gives Codex both versions, one per theme, and mono logos the mono class', () => {
    expect([...parse(logo('codex', 16)).querySelectorAll('svg')].map((s) => s.getAttribute('class'))).toEqual(['logo logo-light', 'logo logo-dark'])
    expect(parse(logo('github', 16)).querySelector('svg')!.getAttribute('class')).toBe('logo mono')
  })

  it('stacks a badge per tool, each carrying its brand colour, and draws nothing for no tools', () => {
    expect(logoBadges(undefined)).toBe('')
    expect(logoBadges([])).toBe('')
    const b = [...parse(logoBadges(['codex', 'vs-code'])).querySelectorAll('.logo-badges > .logo-badge')]
    expect(b.map((e) => e.getAttribute('style'))).toEqual([`--brand:${TOOLS.codex.brand}`, `--brand:${TOOLS['vs-code'].brand}`])
  })

  it('lists the page’s tools as chips under a label', () => {
    const d = parse(toolStrip(['telegram', 'n8n']))
    expect(d.querySelector('.tools-strip-label')!.textContent).toBe('Tools on this page')
    // Named once, by the visible label, so screen readers do not hear it twice.
    const ul = d.querySelector('ul')!
    expect(ul.hasAttribute('aria-label')).toBe(false)
    expect(d.getElementById(ul.getAttribute('aria-labelledby')!)!.textContent).toBe('Tools on this page')
    expect([...d.querySelectorAll('.tool-chip')].map((li) => li.textContent)).toEqual(['Telegram', 'n8n'])
  })

  it('makes one panel template per tool, holding its logo and name', () => {
    const t = parse(toolTemplates(['stripe'])).querySelector('template')!
    expect(t.id).toBe('tool-stripe')
    expect(t.content.querySelector('.ptool')!.textContent).toBe('Stripe')
    expect(t.content.querySelector('use')!.getAttribute('href')).toBe('#logo-stripe')
  })

  it('puts a logo before a glossary term only when the term is a tool', () => {
    expect(glossaryLogo('VS Code')).toContain('href="#logo-vs-code"')
    expect(glossaryLogo('Webhook')).toBe('')
  })

  it('lists the tools used, once each, in order of first appearance', () => {
    expect(toolsUsed([['n8n'], undefined, ['supabase', 'n8n'], ['gmail']])).toEqual(['n8n', 'supabase', 'gmail'])
  })
})
