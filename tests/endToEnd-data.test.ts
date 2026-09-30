import { describe, expect, it } from 'vitest'
import { endToEnd as g, KIND_TYPES } from '@/data/endToEnd'

const allText = () => JSON.stringify(g)

describe('the End-to-End Workflow data', () => {
  it('has the eleven lanes, A to K, in order', () => {
    expect(g.lanes.map((l) => l.id)).toEqual('ABCDEFGHIJK'.split(''))
    expect(g.lanes.map((l) => l.name)).toEqual([
      'Triggers', 'Knowledge and memory', 'Frame the task', 'Build loop', 'Check and repeat', 'Debug and fix',
      'Agents and skills', 'n8n automation', 'Approval and delivery', 'Git and deploy', 'Write-back and reset',
    ])
  })

  it('gives every step a unique id, a real lane, a kind the panel can name, and a plain description', () => {
    const ids = g.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of g.steps) {
      expect(g.lanes.some((l) => l.id === s.lane), s.id).toBe(true)
      expect(KIND_TYPES[s.kind], s.id).toBeTruthy()
      expect(s.what.length, s.id).toBeGreaterThanOrEqual(20)
      expect(s.what.length, s.id).toBeLessThanOrEqual(220)
      expect(s.what, s.id).toMatch(/\.$/)
    }
  })

  it('keeps every step’s name and sub-line to one short line, so cables never cross a second line', () => {
    for (const s of g.steps) {
      expect(s.label.length, s.label).toBeLessThanOrEqual(22)
      expect(s.sub.length, `${s.label}: ${s.sub}`).toBeLessThanOrEqual(22)
    }
  })

  it('joins every cable to real steps', () => {
    const ids = new Set(g.steps.map((s) => s.id))
    for (const c of g.cables) expect(ids.has(c.from) && ids.has(c.to), `${c.from} → ${c.to}`).toBe(true)
  })

  it('never puts two steps in one spot, and keeps lanes narrow (G up to 7 wide, the rest up to 6)', () => {
    for (const lane of g.lanes) {
      const steps = g.steps.filter((s) => s.lane === lane.id)
      const spots = steps.map((s) => s.at.join(','))
      expect(new Set(spots).size, lane.id).toBe(spots.length)
      expect(Math.max(...steps.map((s) => s.at[0])), lane.id).toBeLessThanOrEqual(lane.id === 'G' ? 6 : 5)
    }
  })

  it('flows one way: without the loop-backs, the cables never go round in a circle', () => {
    const flow = g.cables.filter((c) => c.kind === 'flow')
    const left = new Map(g.steps.map((s) => [s.id, flow.filter((c) => c.to === s.id).length]))
    const queue = g.steps.filter((s) => left.get(s.id) === 0).map((s) => s.id)
    let seen = 0
    while (queue.length) {
      const id = queue.shift()!
      seen++
      for (const c of flow.filter((c) => c.from === id)) {
        left.set(c.to, left.get(c.to)! - 1)
        if (left.get(c.to) === 0) queue.push(c.to)
      }
    }
    expect(seen).toBe(g.steps.length)
  })

  it('starts only at the three triggers and ends only at Fresh session', () => {
    const starts = g.steps.filter((s) => !g.cables.some((c) => c.to === s.id)).map((s) => s.id)
    const ends = g.steps.filter((s) => !g.cables.some((c) => c.from === s.id)).map((s) => s.id)
    expect(starts.sort()).toEqual(['a1', 'a2', 'a3'])
    expect(ends).toEqual(['k4'])
    expect(g.steps.filter((s) => s.kind === 'trigger' && s.lane === 'A')).toHaveLength(3)
  })

  it('numbers the steps of every lane but A and G, left to right from 1', () => {
    for (const lane of g.lanes) {
      const steps = g.steps.filter((s) => s.lane === lane.id).sort((a, b) => a.at[0] - b.at[0])
      if (lane.id === 'A' || lane.id === 'G') expect(steps.every((s) => s.n === undefined), lane.id).toBe(true)
      else expect(steps.map((s) => s.n), lane.id).toEqual(steps.map((_, i) => i + 1))
    }
  })

  it('has one approval gate, ten agent jobs, and five steps that run on their own', () => {
    expect(g.steps.filter((s) => s.kind === 'gate').map((s) => s.id)).toEqual(['i1'])
    expect(g.steps.filter((s) => s.kind === 'agent').map((s) => s.label)).toEqual([
      'Researcher', 'Auditor', 'Builder', 'Writer', 'Reel maker', 'Reviewer', 'Deliverables', 'Monitor', 'Data tidy', 'Memory keeper',
    ])
    expect(g.steps.filter((s) => s.enforced).map((s) => s.id).sort()).toEqual(['a2', 'e1', 'h5', 'j4', 'k2'])
  })

  it('draws the spec’s loop-backs with their labels', () => {
    const loops = g.cables.filter((c) => c.kind === 'loop').map((c) => `${c.from}→${c.to}:${c.label}`)
    expect(loops.sort()).toEqual([
      'e4→d2:fails', 'f4→e1:re-check', 'i1→d2:send back with a note', 'j4→j3:fails: roll back and redeploy', 'k3→c1:becomes a rule',
    ].sort())
  })

  it('has a five-item legend and explains every glossary term, each of which is on the graph', () => {
    expect(g.legend.map((k) => k.id)).toEqual(['cable', 'signal', 'loop', 'gate', 'auto'])
    const onGraph = [...g.lanes.flatMap((l) => [l.name, l.note]), ...g.steps.flatMap((s) => [s.label, s.sub, s.what]), ...g.cables.map((c) => c.label ?? '')]
      .join(' ')
      .toLowerCase()
    expect(g.glossary.terms.length).toBeGreaterThanOrEqual(20)
    for (const [term, meaning] of g.glossary.terms) {
      expect(onGraph, term).toContain(term.toLowerCase())
      expect(meaning, term).toMatch(/\.$/)
    }
  })

  it('uses curly quotes only and never mentions GoHighLevel', () => {
    expect(allText()).not.toContain("'")
    expect(allText()).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
