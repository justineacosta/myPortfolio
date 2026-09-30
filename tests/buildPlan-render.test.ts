import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { plan, type Plan } from '@/data/buildPlan'
import { iconSvg } from '@/lib/buildPlan/icons'
import { renderPlan } from '@/lib/buildPlan/render'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderPlan()
const doc = new DOMParser().parseFromString(html, 'text/html')
const flows = [...plan.workflows, ...plan.helpers.list]
const SECTIONS = ['start', 'naming', 'data', 'triggers', 'tm-01', 'tm-02', 'tm-03', 'tm-04', 'tm-05', 'tm-06', 'helpers', 'tests', 'build', 'handover']

describe('renderPlan', () => {
  it('opens with the title, the promise, the facts and the diagram key', () => {
    expect(doc.title).toBe('Trusted Mover build plan')
    expect(doc.querySelector('h1')!.textContent).toBe(plan.heading)
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/build-plan.html')
    expect(doc.querySelectorAll('.meta dt')).toHaveLength(plan.meta.length)
    expect(doc.querySelectorAll('.legend li')).toHaveLength(8)
  })

  it('has every section in order, each linked from the section bar', () => {
    expect([...doc.querySelectorAll('main > section')].map((s) => s.id)).toEqual(SECTIONS)
    expect([...doc.querySelectorAll('nav.toc a')].map((a) => a.getAttribute('href'))).toEqual(SECTIONS.map((s) => `#${s}`))
  })

  it('can be shared: its own title and description for link previews', () => {
    const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content')
    expect(meta('meta[property="og:title"]')).toBe(plan.title)
    expect(meta('meta[property="og:description"]')).toBe(plan.description)
    expect(meta('meta[property="og:type"]')).toBe('article')
    expect(meta('meta[name="twitter:card"]')).toBe('summary')
  })

  it('links back to the portfolio on its own, but not inside the site window', () => {
    const home = doc.querySelector<HTMLAnchorElement>('a.home')!
    expect(home.getAttribute('href')).toBe('/')
    expect(home.getAttribute('target')).toBe('_top')
    expect(home.textContent).toContain('Justine Acosta')
    expect(html).toContain(':root[data-embedded] .home{display:none}')
    const by = doc.querySelector('footer a')!
    expect(by.getAttribute('href')).toBe('/')
    expect(by.getAttribute('target')).toBe('_top')
  })

  it('never shows how long the build takes', () => {
    expect(doc.querySelector('.meta')!.textContent).not.toContain('Build time')
    expect(doc.getElementById('build')!.textContent).not.toMatch(/\d+(\.\d+)? ?h\b|hours/)
  })

  it('ends with the fictional-client note', () => {
    expect(doc.querySelector('footer')!.textContent).toContain('A worked example. Trusted Mover is a fictional client.')
  })

  it("wears Kraft's tokens for both themes, straight from the token file", () => {
    for (const theme of ['dark', 'light'] as const) {
      const t = readTokens(theme)
      expect(html).toContain(`--accent:${t.accent}`)
      expect(html).toContain(`--bg:${t.bg}`)
    }
  })

  it("turns up contrast the way the site does, in both themes", () => {
    const c = readContrast()
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=light]){--ink2:${c.dark.ink2};--ink3:${c.dark.ink3}`)
    expect(html).toContain(`:root[data-a11y-contrast=true][data-theme=light]{--ink2:${c.light.ink2};--ink3:${c.light.ink3}`)
  })

  it('draws every node as a button that has settings to show', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('button.node')]
    expect(buttons).toHaveLength(flows.reduce((a, w) => a + w.nodes.length, 0))
    const data = JSON.parse(doc.getElementById('plan-nodes')!.textContent!)
    for (const b of buttons) expect(data[b.dataset.node!], b.dataset.node).toMatchObject({ label: expect.any(String), type: expect.any(String) })
    expect(data['tm-01:n6'].settings).toContainEqual(['Model', 'Claude Haiku 4.5'])
  })

  it('puts a plain description in every panel, and makes the key and the stages clickable too', () => {
    const data = JSON.parse(doc.getElementById('plan-nodes')!.textContent!)
    expect(data['tm-01:n6'].what).toMatch(/^Claude reads the request/)
    const keys = [...doc.querySelectorAll<HTMLElement>('.legend button[data-node]')]
    const stages = [...doc.querySelectorAll<HTMLElement>('.stages button[data-node]')]
    expect(keys).toHaveLength(8)
    expect(stages).toHaveLength(9)
    for (const b of [...keys, ...stages]) {
      expect(data[b.dataset.node!].what, b.dataset.node).toMatch(/.$/)
      expect(b.getAttribute('aria-haspopup')).toBe('dialog')
    }
    const what = doc.querySelector('#node-panel [data-p=what]')!
    expect(what.compareDocumentPosition(doc.querySelector('#node-panel dl')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('gives every diagram a caption, a scrolling frame and a step list for screen readers', () => {
    const figures = [...doc.querySelectorAll('figure.canvas')]
    expect(figures).toHaveLength(9)
    figures.forEach((f, i) => {
      expect(f.querySelector('figcaption')!.textContent).toContain(flows[i].code)
      expect(f.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
      expect(f.querySelectorAll('ol.steps li')).toHaveLength(flows[i].nodes.length)
    })
  })

  it('lists the twenty test rows with a labelled tick box each', () => {
    const boxes = [...doc.querySelectorAll<HTMLInputElement>('.tests input[type=checkbox]')]
    expect(boxes.map((b) => b.value)).toEqual(plan.tests.rows.map((r) => r.id))
    expect(boxes[0].getAttribute('aria-label')).toBe('Passed: t01 New quote')
    expect(doc.getElementById('tests-count')!.textContent).toBe('0 of 20 passed')
  })

  it('escapes everything from the data, and its JSON cannot close its script tag', () => {
    const evil: Plan = {
      ...plan,
      heading: '<img src=x onerror=alert(1)>',
      workflows: [{ ...plan.workflows[0], nodes: plan.workflows[0].nodes.map((n) => (n.id === 'n1' ? { ...n, label: '</script><script>alert(1)</script>' } : n)) }, ...plan.workflows.slice(1)],
    }
    const out = renderPlan(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect(JSON.parse(d.getElementById('plan-nodes')!.textContent!)['tm-01:n1'].label).toBe('</script><script>alert(1)</script>')
  })

  it('escapes ids too, so even a stray quote in the data cannot become markup', () => {
    const w = plan.workflows[0]
    const bad = 'n1"><i>y</i>'
    const odd: Plan = {
      ...plan,
      workflows: [
        {
          ...w,
          code: 'TM-01"><b>x</b>',
          nodes: w.nodes.map((n) => (n.id === 'n1' ? { ...n, id: bad } : n)),
          edges: w.edges.map((e) => (e.from === 'n1' ? { ...e, from: bad } : e)),
        },
        ...plan.workflows.slice(1),
      ],
    }
    const d = new DOMParser().parseFromString(renderPlan(odd), 'text/html')
    const injected = [...d.querySelectorAll('b, i')].filter((el) => el.textContent === 'x' || el.textContent === 'y')
    expect(injected).toEqual([])
  })

  it('renders every icon the plan names', () => {
    for (const w of flows) for (const n of w.nodes) expect(iconSvg(n.icon), n.icon).toMatch(/^<svg /)
  })

  it('stays one small, self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})

describe('public/build-plan.html', () => {
  it('is up to date with its data (run npm run plan after any change)', () => {
    expect(readFileSync('public/build-plan.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderPlan())
  })
})
