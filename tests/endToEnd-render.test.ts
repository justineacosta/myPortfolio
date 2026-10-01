import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { endToEnd as g, type EndToEnd } from '@/data/endToEnd'
import { iconSvg } from '@/lib/endToEnd/icons'
import { layoutGraph } from '@/lib/endToEnd/layout'
import { renderEndToEnd } from '@/lib/endToEnd/render'
import { TOOLS } from '@/lib/brand/tools'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderEndToEnd()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)

describe('renderEndToEnd', () => {
  it('opens with the title, the card’s line, the stance and the legend', () => {
    expect(doc.title).toBe(g.title)
    expect(doc.querySelector('h1')!.textContent).toBe('The End-to-End Workflow')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.stance')!.textContent).toBe('Nothing leaves the graph without a human yes.')
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/end-to-end.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the eleven lanes, each pointing at its lane', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.lanes.map((l) => `#lane-${l.id.toLowerCase()}`))
    expect(doc.querySelector('nav.toc')!.getAttribute('aria-label')).toBe('Lanes')
    for (const lane of g.lanes) expect(doc.getElementById(`lane-${lane.id.toLowerCase()}`)!.querySelector('.lane-head')!.textContent).toContain(lane.name)
  })

  it('makes the five legend keys clickable, each with its meaning', () => {
    const keys = [...doc.querySelectorAll<HTMLElement>('.legend button[data-node]')]
    expect(keys.map((k) => k.dataset.node)).toEqual(g.legend.map((k) => `key:${k.id}`))
    for (const k of keys) {
      expect(data()[k.dataset.node!].what).toMatch(/\.$/)
      expect(k.getAttribute('aria-haspopup')).toBe('dialog')
    }
  })

  it('draws every step as a button with a plain description, its number, and its gate or machine badge', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('button.node')]
    expect(buttons.map((b) => b.dataset.node)).toEqual(g.steps.map((s) => s.id))
    for (const s of g.steps) {
      const b = doc.querySelector(`button.node[data-node="${s.id}"]`)!
      expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
      expect(b.querySelector('.badge-n')?.textContent ?? null, s.id).toBe(s.n === undefined ? null : String(s.n))
      expect(!!b.querySelector('.badge-auto'), s.id).toBe(!!s.enforced)
      expect(!!b.querySelector('.badge-lock'), s.id).toBe(s.kind === 'gate')
    }
    expect(data().i1.type).toBe('APPROVAL GATE')
    expect(data().e1.type).toBe('STEP · RUNS ON ITS OWN')
  })

  it('draws every cable, loop-backs dashed, with its label', () => {
    expect(doc.querySelectorAll('.edge[data-edge]')).toHaveLength(g.cables.length)
    expect(doc.querySelectorAll('.edge.loop')).toHaveLength(g.cables.filter((c) => c.kind === 'loop').length)
    expect(doc.querySelectorAll('.edge-label')).toHaveLength(g.cables.filter((c) => c.label).length)
    expect(doc.querySelectorAll('.edge-label.start').length).toBeGreaterThan(0)
  })

  it('sends balls down the layout’s routes, with the timing the page needs to light steps up', () => {
    const f = doc.querySelector<HTMLElement>('figure.canvas')!
    const routes = JSON.parse(f.dataset.routes!) as { len: number; stops: [string, number][]; spans: [number, number, number][] }[]
    expect(routes).toHaveLength(layoutGraph(g).routes.length)
    expect(f.querySelectorAll('.run-dot')).toHaveLength(routes.length)
    for (const r of routes) {
      for (const [key] of r.stops) expect(f.querySelector(`[data-node="${key}"]`), key).not.toBeNull()
      for (const [edge] of r.spans) expect(edge).toBeLessThan(g.cables.length)
    }
  })

  it('lists each lane’s steps for screen readers, and scrolls in its own frame', () => {
    for (const lane of g.lanes) {
      const list = doc.querySelectorAll(`#lane-${lane.id.toLowerCase()} ol.steps li`)
      expect(list, lane.id).toHaveLength(g.steps.filter((s) => s.lane === lane.id).length)
    }
    expect(doc.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(g.glossary.terms.length)
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
    expect(html).toContain(':root[data-embedded] .home{display:none}')
  })

  it('wears Kraft’s tokens and the site’s contrast settings', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=light]){--ink2:${readContrast().dark.ink2}`)
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'a1"><i>y</i>'
    const evil: EndToEnd = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      steps: g.steps.map((s) => (s.id === 'a1' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
      cables: g.cables.map((c) => (c.from === 'a1' ? { ...c, from: bad } : c)),
    }
    const out = renderEndToEnd(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the graph names', () => {
    for (const s of g.steps) expect(iconSvg(s.icon), s.icon).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(400_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})

describe('public/end-to-end.html', () => {
  it('is up to date with its data (run npm run e2e-page after any change)', () => {
    expect(readFileSync('public/end-to-end.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderEndToEnd())
  })
})

describe('the End-to-End page’s logos and colour', () => {
  const used = ['telegram', 'n8n', 'claude-code', 'vs-code', 'codex', 'github', 'vercel'] as const

  it('badges exactly the steps that name a tool', () => {
    for (const s of g.steps) {
      const hrefs = [...doc.querySelectorAll(`[data-node="${s.id}"] .logo-badge`)].map((b) => b.querySelector('use')!.getAttribute('href'))
      expect(hrefs, s.id).toEqual((s.tools ?? []).map((t) => `#logo-${t}`))
    }
  })

  it('lists the tools in the hero, after the stance, in order of first appearance', () => {
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((c) => c.textContent)).toEqual(used.map((t) => TOOLS[t].name))
    expect(doc.querySelector('.stance + .tools-strip')).not.toBeNull()
  })

  it('draws each logo it uses once (Codex with its dark version), and no other', () => {
    expect([...doc.querySelectorAll('.logo-sheet symbol')].map((s) => s.id)).toEqual(used.flatMap((t) => [`logo-${t}`, ...(TOOLS[t].dark ? [`logo-${t}-dark`] : [])]))
  })

  it('puts a logo before each glossary term that is a tool', () => {
    const withLogo = [...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)
    expect(withLogo).toEqual(['n8n', 'Telegram', 'Claude Code', 'VS Code', 'Codex'])
  })

  it('gives the panel a tools slot and the index each step’s tools', () => {
    expect(doc.querySelector('#node-panel > [data-p=tools]')!.hasAttribute('hidden')).toBe(true)
    expect(data().d2.tools).toEqual(['claude-code'])
    expect(data().c1.tools).toBeUndefined()
  })

  it('adds the lively layer with the Claude and Telegram glow, the reveal script last, and grows by no more than 40 KB', () => {
    expect(doc.body.firstElementChild!.outerHTML).toBe('<div class="page-glow" aria-hidden="true"><div></div></div>')
    expect([...doc.querySelectorAll('script')].at(-1)!.textContent).toContain("root.classList.add('reveal-on')")
    expect(html.length).toBeLessThan(190_923 + 40_000)
  })
})
