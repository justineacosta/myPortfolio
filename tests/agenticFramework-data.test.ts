import { describe, expect, it } from 'vitest'
import { agenticFramework as g, KIND_TYPES } from '@/data/agenticFramework'

const allText = () => JSON.stringify(g)

describe('the Agentic Framework data', () => {
  it('has the eight sections, in order, each with a chip, a kicker, a title and a line', () => {
    expect(g.sections.map((s) => s.id)).toEqual(['glance', 'jobs', 'tools', 'rules', 'loop', 'example', 'habits', 'glossary'])
    expect(g.sections.map((s) => s.chip)).toEqual(['At a glance', 'Two jobs', 'Tools', 'Rules', 'The loop', 'Example', 'Habits', 'Glossary'])
    for (const s of g.sections) for (const v of [s.kicker, s.title, s.blurb]) expect(v.length, s.id).toBeGreaterThan(3)
  })

  it('keeps the card’s three tools and four rules, word for word', () => {
    expect(g.tools.map((t) => t.title)).toEqual(['Claude Code', 'VS Code', 'Codex'])
    expect(g.tools[0].note).toBe('Opus for planning, Sonnet for volume')
    expect(g.rules.map((r) => `${r.mark} ${r.title}`)).toEqual([
      'R1 Write the spec first', 'R2 Every write is approval-gated', 'R3 Small units of work', 'R4 The model grades itself',
    ])
    expect(g.rules[0].text).toBe('If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.')
  })

  it('has three stages, two jobs of four lines each, and four habits', () => {
    expect(g.stages.map((s) => s.title)).toEqual(['Set up once', 'Build in small loops', 'Ship on a yes'])
    expect(g.jobs.columns.map((c) => [c.title, c.items.length])).toEqual([['Me', 4], ['The AI', 4]])
    expect(g.habits.map((h) => h.title)).toEqual(['Fresh session per task', 'Read every diff', 'No new asks mid-run', 'Check it on the real URL'])
    expect(g.closing).toBe('Done is a URL, not a diff.')
  })

  it('gives every loop step a unique id, a kind the panel can name, a short label and a plain description', () => {
    const ids = g.loop.steps.map((s) => s.id)
    expect(ids).toEqual(['task', 'frame', 'build', 'check', 'gate', 'live', 'fold'])
    for (const s of g.loop.steps) {
      expect(KIND_TYPES[s.kind], s.id).toBeTruthy()
      expect(s.label.length, s.label).toBeLessThanOrEqual(22)
      expect(s.sub.length, `${s.label}: ${s.sub}`).toBeLessThanOrEqual(22)
      expect(s.what.length, s.id).toBeGreaterThanOrEqual(20)
      expect(s.what.length, s.id).toBeLessThanOrEqual(220)
      expect(s.what, s.id).toMatch(/\.$/)
    }
  })

  it('never puts two steps in one spot', () => {
    const spots = g.loop.steps.map((s) => s.at.join(','))
    expect(new Set(spots).size).toBe(spots.length)
  })

  it('joins every cable to real steps, starts only at the task and ends only at Shipped', () => {
    const ids = new Set(g.loop.steps.map((s) => s.id))
    for (const c of g.loop.cables) expect(ids.has(c.from) && ids.has(c.to), `${c.from} → ${c.to}`).toBe(true)
    const starts = g.loop.steps.filter((s) => !g.loop.cables.some((c) => c.to === s.id)).map((s) => s.id)
    const ends = g.loop.steps.filter((s) => !g.loop.cables.some((c) => c.from === s.id)).map((s) => s.id)
    expect(starts).toEqual(['task'])
    expect(ends).toEqual(['live'])
  })

  it('flows one way: without the loop-backs, the cables never go round in a circle', () => {
    const flow = g.loop.cables.filter((c) => c.kind === 'flow')
    const left = new Map(g.loop.steps.map((s) => [s.id, flow.filter((c) => c.to === s.id).length]))
    const queue = g.loop.steps.filter((s) => left.get(s.id) === 0).map((s) => s.id)
    let seen = 0
    while (queue.length) {
      const id = queue.shift()!
      seen++
      for (const c of flow.filter((c) => c.from === id)) {
        left.set(c.to, left.get(c.to)! - 1)
        if (left.get(c.to) === 0) queue.push(c.to)
      }
    }
    expect(seen).toBe(g.loop.steps.length)
  })

  it('draws the spec’s loop-backs with their labels, and one approval gate', () => {
    const loops = g.loop.cables.filter((c) => c.kind === 'loop').map((c) => `${c.from}→${c.to}:${c.label}`)
    expect(loops.sort()).toEqual(['check→fold:fails', 'fold→frame:becomes a rule', 'gate→build:send back'])
    expect(g.loop.steps.filter((s) => s.kind === 'gate').map((s) => s.id)).toEqual(['gate'])
  })

  it('pins each rule once, where it applies', () => {
    expect(Object.fromEntries(g.loop.steps.filter((s) => s.rule).map((s) => [s.id, s.rule]))).toEqual({ frame: 'R1', build: 'R3', check: 'R4', gate: 'R2' })
  })

  it('has a five-item legend, each with a meaning', () => {
    expect(g.loop.legend.map((k) => k.id)).toEqual(['cable', 'signal', 'loop', 'gate', 'pin'])
    for (const k of g.loop.legend) expect(k.what, k.id).toMatch(/\.$/)
  })

  it('never counts steps in the loop’s caption, so it cannot contradict “Four steps” in the blurb above it', () => {
    expect(g.sections.find((s) => s.id === 'loop')!.blurb).toMatch(/^Four steps/)
    expect(g.loop.caption).not.toMatch(/\d+ steps/)
  })

  it('follows the End-to-End page through the loop in six steps, linking to it', () => {
    expect(g.example.items.map((i) => i.stage)).toEqual(['Frame', 'Frame', 'Build', 'Check', 'Fold back', 'Ship'])
    expect(g.example.items[3].text).toContain('a fresh reviewer model')
    expect(g.example.items[3].text).not.toContain('Codex')
    expect(g.example.link.href).toBe('/end-to-end.html')
  })

  it('explains every glossary term, and each one is used elsewhere on the page', () => {
    const elsewhere = JSON.stringify({ ...g, glossary: [] }).toLowerCase()
    expect(g.glossary.length).toBeGreaterThanOrEqual(18)
    for (const [term, meaning] of g.glossary) {
      expect(elsewhere, term).toContain(term.toLowerCase())
      expect(meaning, term).toMatch(/\.$/)
    }
  })

  it('uses curly quotes only and never mentions GoHighLevel', () => {
    expect(allText()).not.toContain("'")
    expect(allText()).not.toContain('\\"')
    expect(allText(), 'the editor is VS Code').not.toMatch(/cursor/i)
    expect(allText()).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
