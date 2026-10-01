import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agenticFramework as g, type AgenticFramework } from '@/data/agenticFramework'
import { layoutLoop } from '@/lib/agenticFramework/layout'
import { renderAgenticFramework } from '@/lib/agenticFramework/render'
import { iconSvg } from '@/lib/endToEnd/icons'
import { TOOLS } from '@/lib/brand/tools'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAgenticFramework()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)

describe('renderAgenticFramework', () => {
  it('opens with the title, the card’s line, the stance and the three tools', () => {
    expect(doc.title).toBe(g.title)
    expect(doc.querySelector('h1')!.textContent).toBe('The Agentic Framework')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.stance')!.textContent).toBe('I make the calls. The AI does the typing.')
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['Claude Code', 'VS Code', 'Codex'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/agentic-framework.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the eight sections, each pointing at its section', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(doc.querySelector('nav.toc')!.getAttribute('aria-label')).toBe('Sections')
    expect(chips.map((a) => a.textContent)).toEqual(g.sections.map((s) => s.chip))
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.sections.map((s) => `#${s.id}`))
    for (const s of g.sections) expect(doc.querySelector(`section#${s.id} h2`)!.textContent).toBe(s.title)
  })

  it('shows the stages, the two jobs, the tools, the rules and the habits as tiles', () => {
    expect(doc.querySelectorAll('#glance .tile')).toHaveLength(3)
    expect(doc.querySelectorAll('#tools .tile')).toHaveLength(3)
    expect([...doc.querySelectorAll('#rules .tile-mark')].map((m) => m.textContent)).toEqual(['R1', 'R2', 'R3', 'R4'])
    expect(doc.querySelectorAll('#habits .tile')).toHaveLength(4)
    expect(doc.querySelector('#habits .closing')!.textContent).toBe('Done is a URL, not a diff.')
    expect([...doc.querySelectorAll('#jobs .job h3')].map((h) => h.textContent)).toEqual(['Me', 'The AI'])
    expect(doc.querySelectorAll('#jobs .job li')).toHaveLength(8)
    expect(doc.querySelector('#jobs .jobs-line')!.textContent).toBe(g.jobs.line)
  })

  it('draws every loop step as a button with its description, and the gate with a lock', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('#loop button.node')]
    expect(buttons.map((b) => b.dataset.node)).toEqual(g.loop.steps.map((s) => s.id))
    for (const s of g.loop.steps) {
      expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
      expect(!!doc.querySelector(`button.node[data-node="${s.id}"] .badge-lock`), s.id).toBe(s.kind === 'gate')
    }
    expect(data().gate.type).toBe('APPROVAL GATE')
  })

  it('pins are their own buttons, never inside a step, and each explains its rule', () => {
    const pins = [...doc.querySelectorAll<HTMLButtonElement>('#loop button.pin')]
    expect(pins.map((p) => p.dataset.node)).toEqual(['rule:R1', 'rule:R3', 'rule:R4', 'rule:R2'])
    for (const p of pins) expect(p.closest('button.node')).toBeNull()
    // Each pin comes straight after its step, so Tab reaches a step and then its rule.
    for (const [step, rule] of [['frame', 'R1'], ['build', 'R3'], ['check', 'R4'], ['gate', 'R2']])
      expect(doc.querySelector(`button.node[data-node="${step}"]`)!.nextElementSibling!.getAttribute('data-node'), step).toBe(`rule:${rule}`)
    expect(data()['rule:R1']).toMatchObject({ label: 'Write the spec first', type: 'RULE R1', what: g.rules[0].text })
    expect(pins[0].getAttribute('aria-label')).toBe('Rule R1: Write the spec first')
  })

  it('makes the five legend keys clickable, each with its meaning', () => {
    const keys = [...doc.querySelectorAll<HTMLElement>('#loop .legend button[data-node]')]
    expect(keys.map((k) => k.dataset.node)).toEqual(g.loop.legend.map((k) => `key:${k.id}`))
    for (const k of keys) expect(data()[k.dataset.node!].what).toMatch(/\.$/)
  })

  it('draws every cable, loop-backs dashed, with its label', () => {
    expect(doc.querySelectorAll('#loop .edge[data-edge]')).toHaveLength(g.loop.cables.length)
    expect(doc.querySelectorAll('#loop .edge.loop')).toHaveLength(3)
    expect([...doc.querySelectorAll('#loop .edge-label')].map((e) => e.textContent).sort()).toEqual(['approved', 'becomes a rule', 'fails', 'passes', 'send back'])
    // The screen-reader list already says each one in context.
    for (const e of doc.querySelectorAll('#loop .edge-label')) expect(e.getAttribute('aria-hidden'), e.textContent!).toBe('true')
  })

  it('sends balls down the layout’s three routes, with the timing the page needs to light steps up', () => {
    const f = doc.querySelector<HTMLElement>('figure.canvas')!
    expect(f.hasAttribute('data-run')).toBe(true)
    const routes = JSON.parse(f.dataset.routes!) as { len: number; stops: [string, number][]; spans: [number, number, number][] }[]
    expect(routes).toHaveLength(layoutLoop(g.loop).routes.length)
    expect(f.querySelectorAll('.run-dot')).toHaveLength(3)
    for (const r of routes) for (const [key] of r.stops) expect(f.querySelector(`.node[data-node="${key}"]`), key).not.toBeNull()
  })

  it('lists the loop for screen readers, and scrolls in its own frame', () => {
    expect(doc.querySelectorAll('#loop ol.steps.sr-only li')).toHaveLength(g.loop.steps.length)
    expect(doc.querySelector('#loop ol.steps')!.textContent).toContain('Check (Codex · VS Code), rule R4, then Approval if passes; Fold back if fails')
    expect(doc.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
  })

  it('follows the End-to-End page in six tagged steps, linking to it in the top window', () => {
    const items = [...doc.querySelectorAll('#example ol.timeline li')]
    expect(items).toHaveLength(6)
    // A stage that runs on shows its tag once; screen readers still hear it.
    expect(items.map((li) => li.querySelector('.tag')?.textContent ?? null)).toEqual(['Frame', null, 'Build', 'Check', 'Fold back', 'Ship'])
    expect(items.map((li) => li.classList.contains('cont'))).toEqual([false, true, false, false, false, false])
    expect(items[1].querySelector('.sr-only')!.textContent).toBe('Frame, continued')
    expect(items[4].querySelector('.tag')!.classList.contains('t-fold-back')).toBe(true)
    const see = doc.querySelector('#example a.see')!
    expect(see.getAttribute('href')).toBe('/end-to-end.html')
    expect(see.getAttribute('target')).toBe('_top')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(g.glossary.length)
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
    expect(html).toContain(':root[data-embedded] .home{display:none}')
  })

  it('runs End-to-End’s client as it is', () => {
    expect(html).toContain(readFileSync('lib/endToEnd/client.js', 'utf8').replace(/\r\n/g, '\n'))
  })

  it('wears Kraft’s tokens and the site’s contrast settings', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=light]){--ink2:${readContrast().dark.ink2}`)
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'task"><i>y</i>'
    const evil: AgenticFramework = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      loop: {
        ...g.loop,
        steps: g.loop.steps.map((s) => (s.id === 'task' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
        cables: g.loop.cables.map((c) => (c.from === 'task' ? { ...c, from: bad } : c)),
      },
    }
    const out = renderAgenticFramework(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the page names', () => {
    for (const name of [...g.stages, ...g.tools, ...g.rules, ...g.habits, ...g.loop.steps].map((x) => x.icon)) expect(iconSvg(name), name).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})

describe('public/agentic-framework.html', () => {
  it('is up to date with its data (run npm run af-page after any change)', () => {
    expect(readFileSync('public/agentic-framework.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderAgenticFramework())
  })
})

describe('the Agentic page’s logos and colour', () => {
  it('badges Frame and Build with Claude Code, and Check with Codex then VS Code', () => {
    const hrefs = (id: string) => [...doc.querySelectorAll(`[data-node="${id}"] .logo-badge`)].map((b) => b.querySelector('use')!.getAttribute('href'))
    expect(hrefs('frame')).toEqual(['#logo-claude-code'])
    expect(hrefs('build')).toEqual(['#logo-claude-code'])
    expect(hrefs('check')).toEqual(['#logo-codex', '#logo-vs-code'])
    expect(hrefs('gate')).toEqual([])
  })

  it('shows the real logo on each tool tile, and the Phosphor icon everywhere else', () => {
    const tiles = [...doc.querySelectorAll('#tools .tile-icon')]
    expect(tiles.map((t) => t.querySelector('use')!.getAttribute('href'))).toEqual(['#logo-claude-code', '#logo-vs-code', '#logo-codex'])
    expect(doc.querySelector('#rules .tile-icon use')).toBeNull()
  })

  it('draws each logo once, with Codex’s dark version, and puts logos before the tool terms in the glossary', () => {
    expect([...doc.querySelectorAll('.logo-sheet symbol')].map((s) => s.id)).toEqual(['logo-claude-code', 'logo-vs-code', 'logo-codex', 'logo-codex-dark'])
    expect([...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)).toEqual(['Claude Code', 'VS Code', 'Codex'])
  })

  it('gives the panel a tools slot and the index each step’s tools', () => {
    expect(doc.querySelector('#node-panel > [data-p=tools]')!.hasAttribute('hidden')).toBe(true)
    expect(data().check.tools).toEqual(['codex', 'vs-code'])
    expect(data()['rule:R1'].tools).toBeUndefined()
  })

  it('adds the lively layer with the Claude and VS Code glow, the reveal script last, and grows by no more than 40 KB', () => {
    expect(doc.querySelector('style')!.textContent).toContain(`--halo-b:${TOOLS['vs-code'].brand}`)
    expect([...doc.querySelectorAll('script')].at(-1)!.textContent).toContain("root.classList.add('reveal-on')")
    expect(html.length).toBeLessThan(68_774 + 40_000)
  })
})
