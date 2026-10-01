import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agents as g, type Agents } from '@/data/agents'
import { layoutDiagram } from '@/lib/agents/layout'
import { renderAgents } from '@/lib/agents/render'
import { themeHeadJs } from '@/lib/brand/render'
import { iconSvg } from '@/lib/endToEnd/icons'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAgents()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)
const focus = () => JSON.parse(doc.getElementById('agent-builds')!.textContent!)
const fig = (id: string) => doc.querySelector<HTMLElement>(`figure[data-diagram="${id}"]`)!

describe('renderAgents', () => {
  it('picks its theme in <head>, before the styles', () => {
    const first = doc.head.querySelector('script, style')!
    expect(first.tagName).toBe('SCRIPT')
    expect(first.textContent).toBe(themeHeadJs())
  })

  it('opens with the title, the lede, the sample note and every tool, Claude, n8n and Supabase first', () => {
    expect(doc.title).toBe('AI agents and RAG chatbots · Justine Acosta')
    expect(doc.querySelector('h1')!.textContent).toBe('How my AI agents and RAG chatbots work')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.sample-note')!.textContent).toBe(g.sample)
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['Claude', 'n8n', 'Supabase', 'Cal.com', 'Telegram', 'Google Sheets', 'Gmail', 'Stripe'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/ai-agents.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the six sections, each pointing at its section', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(chips.map((a) => a.textContent)).toEqual(g.sections.map((s) => s.chip))
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.sections.map((s) => `#${s.id}`))
    for (const s of g.sections) expect(doc.querySelector(`section#${s.id} h2`)!.textContent).toBe(s.title)
  })

  it('shows three tiles at a glance and the four guardrails', () => {
    expect([...doc.querySelectorAll('#glance .tile h3')].map((h) => h.textContent)).toEqual(['RAG chatbots', 'AI agents', 'Your yes'])
    expect([...doc.querySelectorAll('#guardrails .tile-mark')].map((m) => m.textContent)).toEqual(['G1', 'G2', 'G3', 'G4'])
  })

  for (const id of ['rag', 'agent'] as const) {
    const d = g.diagrams[id]
    it(`${id}: draws every step as a button with its description, the gate with a lock and each branch with a diamond`, () => {
      const buttons = [...fig(id).querySelectorAll<HTMLButtonElement>('button.node')]
      expect(buttons.map((b) => b.dataset.node)).toEqual(d.steps.map((s) => s.id))
      for (const s of d.steps) {
        expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
        const b = fig(id).querySelector(`button.node[data-node="${s.id}"]`)!
        expect(!!b.querySelector('.badge-lock'), s.id).toBe(s.kind === 'gate')
        expect(!!b.querySelector('.badge-branch'), s.id).toBe(s.kind === 'branch')
      }
    })

    it(`${id}: draws every cable with its index on both path and label, and the legend’s keys`, () => {
      expect(fig(id).querySelectorAll('.edge[data-edge]')).toHaveLength(d.cables.length)
      for (const c of fig(id).querySelectorAll<HTMLElement>('.edge-label')) {
        expect(c.getAttribute('aria-hidden')).toBe('true')
        expect(d.cables[Number(c.dataset.edge)].label).toBe(c.textContent)
      }
      const keys = [...doc.querySelectorAll<HTMLElement>(`#${id} .legend button[data-node]`)]
      expect(keys.map((k) => k.dataset.node)).toEqual(d.legend.map((k) => `key:${id}:${k.id}`))
    })

    it(`${id}: sends balls down the data’s four routes`, () => {
      const routes = JSON.parse(fig(id).dataset.routes!) as { len: number }[]
      expect(routes).toHaveLength(4)
      expect(fig(id).querySelectorAll('.run-dot')).toHaveLength(4)
      expect(fig(id).hasAttribute('data-run')).toBe(true)
    })

    it(`${id}: has a caption bar for Show its route: a status line and a hidden Show all`, () => {
      const bar = fig(id).querySelector('.focus-bar')!
      expect(bar.querySelector('p.focus-text')!.getAttribute('role')).toBe('status')
      const all = bar.querySelector<HTMLButtonElement>('button.focus-clear')!
      expect(all.textContent).toBe('Show all')
      expect(all.hidden).toBe(true)
    })
  }

  it('styles each kind of step with its look', () => {
    const cls = (id: string) => doc.querySelector(`button.node[data-node="${id}"]`)!.className
    expect(cls('docs')).toContain('k-trigger')
    expect(cls('answer')).toContain('k-ai')
    expect(cls('chunk')).toContain('k-action')
    expect(cls('sure')).toContain('k-branch')
    expect(cls('gate')).toContain('k-approve')
    expect(cls('act')).toContain('k-end')
  })

  it('makes every pin its own button after its step, with a logo or an icon and its own panel', () => {
    const pins = [...doc.querySelectorAll<HTMLButtonElement>('button.pin')]
    expect(pins).toHaveLength(3 + 3 + 4 + 6 + 2)
    for (const p of pins) expect(p.closest('button.node')).toBeNull()
    const pdf = doc.querySelector('[data-node="pin:docs:pdf"]')!
    expect(pdf.getAttribute('aria-label')).toBe('Source: PDFs')
    expect(pdf.querySelector('use')).toBeNull()
    expect(doc.querySelector('[data-node="pin:tool:stripe"] use')!.getAttribute('href')).toBe('#logo-stripe')
    expect(data()['pin:docs:pdf']).toMatchObject({ label: 'PDFs', type: 'SOURCE', what: 'Contracts, manuals and other uploaded files.' })
    expect(data()['pin:tool:stripe'].tools).toEqual(['stripe'])
    // A step's pins follow it in the Tab order.
    expect(doc.querySelector('button.node[data-node="docs"]')!.nextElementSibling!.getAttribute('data-node')).toBe('pin:docs:docs')
  })

  it('reads each diagram as a list for screen readers', () => {
    expect(doc.querySelectorAll('#rag ol.steps.sr-only li')).toHaveLength(g.diagrams.rag.steps.length)
    expect(doc.querySelector('#rag ol.steps')!.textContent).toContain('Sure? (A source was found), then Reply with source if yes; Hand to a person if no')
    expect(doc.querySelector('#agent ol.steps')!.textContent).toContain('Use a tool (One call at a time), uses Gmail, Stripe, Supabase, Google Sheets, Cal.com, Web page, then Check the result')
  })

  it('shows the eight builds in two groups, each labelled a sample, with its logos and a route button', () => {
    expect([...doc.querySelectorAll('#builds .builds-kind')].map((h) => h.textContent)).toEqual(['RAG chatbots', 'AI agents'])
    const cards = [...doc.querySelectorAll('#builds .build')]
    expect(cards.map((c) => c.querySelector('h4')!.textContent)).toEqual(g.builds.map((b) => b.name))
    for (const [i, c] of cards.entries()) {
      const b = g.builds[i]
      expect(c.querySelector('.sample')!.textContent).toBe('SAMPLE BUILD')
      expect(c.querySelectorAll('.build-logos svg.logo:not(.logo-dark)')).toHaveLength(b.tools.length)
      const btn = c.querySelector<HTMLButtonElement>('button.route-btn')!
      expect(btn.dataset.build).toBe(b.id)
      expect(btn.getAttribute('aria-pressed')).toBe('false')
      expect(btn.getAttribute('aria-label')).toBe(`Show its route: ${b.name}`)
    }
  })

  it('tells Show its route what to light for each build', () => {
    const agent = layoutDiagram(g.diagrams.agent)
    const rag = layoutDiagram(g.diagrams.rag)
    const edge = (l: typeof agent, from: string, to: string) => l.cables.findIndex((c) => c.from === from && c.to === to)
    const f = focus()
    expect(Object.keys(f)).toEqual(g.builds.map((b) => b.id))
    expect(f.billing).toMatchObject({ diagram: 'agent', name: 'Billing follow-up agent', routes: [0, 1, 2], pins: ['pin:trigger:stripe', 'pin:tool:stripe', 'pin:act:gmail', 'pin:act:sheets'] })
    expect(f.billing.nodes).toContain('gate')
    expect(f.billing.edges).not.toContain(edge(agent, 'needs', 'act'))
    expect(f.report.routes).toEqual([3])
    expect(f.report.nodes).not.toContain('gate')
    expect(f.report.edges).toContain(edge(agent, 'needs', 'act'))
    expect(f.helpdesk.edges).toContain(edge(rag, 'store', 'search'))
    expect(f.helpdesk.nodes).not.toContain('book')
    expect(f.sales.nodes).toContain('book')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(15)
    expect([...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)).toEqual(['Claude', 'n8n', 'Supabase'])
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
  })

  it('runs End-to-End’s client as it is', () => {
    expect(html).toContain(readFileSync('lib/endToEnd/client.js', 'utf8').replace(/\r\n/g, '\n'))
  })

  it('wears Kraft’s tokens, the site’s contrast settings and the shared backdrop', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${readContrast().dark.ink2}`)
    expect(doc.body.firstElementChild!.outerHTML).toBe('<div class="page-glow" aria-hidden="true"><div></div></div>')
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'docs"><i>y</i>'
    const rag = g.diagrams.rag
    const evil: Agents = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      diagrams: {
        ...g.diagrams,
        rag: {
          ...rag,
          steps: rag.steps.map((s) => (s.id === 'docs' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
          cables: rag.cables.map((c) => (c.from === 'docs' ? { ...c, from: bad } : c)),
          routes: rag.routes.map((r) => ({ ...r, nodes: r.nodes.map((n) => (n === 'docs' ? bad : n)) })),
        },
      },
      builds: g.builds.map((b) => ({ ...b, pins: b.pins.map((p) => p.replace(/^docs:/, `${bad}:`)), name: b.id === 'team' ? '<b>x</b>' : b.name })),
    }
    const out = renderAgents(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(d.querySelector('#builds b')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the page names', () => {
    const steps = [...g.diagrams.rag.steps, ...g.diagrams.agent.steps]
    for (const name of [...g.glance, ...g.guardrails, ...steps].map((x) => x.icon)) expect(iconSvg(name), name).toMatch(/^<svg /)
    for (const p of steps.flatMap((s) => s.pins ?? [])) if (p.icon) expect(iconSvg(p.icon), p.icon).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})

describe('public/ai-agents.html', () => {
  it('is up to date with its data (run npm run agents-page after any change)', () => {
    expect(readFileSync('public/ai-agents.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderAgents())
  })
})
