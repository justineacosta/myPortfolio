import { describe, expect, it } from 'vitest'
import { KIND_LABELS, plan, type Workflow } from '@/data/buildPlan'

const all: Workflow[] = [...plan.workflows, ...plan.helpers.list]
const outs = (w: Workflow, id: string) => w.edges.filter((e) => e.from === id)

describe('the build plan content', () => {
  it('has six workflows and three helpers, in build order', () => {
    expect(plan.workflows.map((w) => w.code)).toEqual(['TM-01', 'TM-02', 'TM-03', 'TM-04', 'TM-05', 'TM-06'])
    expect(plan.helpers.list.map((w) => w.code)).toEqual(['TM-H01', 'TM-H02', 'TM-H03'])
  })

  it('connects only nodes that exist, each id once per workflow', () => {
    for (const w of all) {
      const ids = w.nodes.map((n) => n.id)
      expect(new Set(ids).size, w.code).toBe(ids.length)
      for (const e of w.edges) {
        expect(ids, `${w.code} ${e.from}`).toContain(e.from)
        expect(ids, `${w.code} ${e.to}`).toContain(e.to)
      }
    }
  })

  it('gives every decision two or more labelled ways out, and every other step at most one', () => {
    for (const w of all) {
      for (const n of w.nodes) {
        const out = outs(w, n.id)
        if (n.kind === 'branch') {
          expect(out.length, `${w.code} ${n.id}`).toBeGreaterThanOrEqual(2)
          expect(out.every((e) => e.label), `${w.code} ${n.id}`).toBe(true)
        } else {
          expect(out.length, `${w.code} ${n.id}`).toBeLessThanOrEqual(1)
          expect(out.some((e) => e.label), `${w.code} ${n.id}`).toBe(false)
        }
      }
    }
  })

  it('starts every flow at a trigger, and every trigger starts a flow', () => {
    for (const w of all) {
      const entered = new Set(w.edges.map((e) => e.to))
      for (const n of w.nodes) expect(n.kind === 'trigger', `${w.code} ${n.id}`).toBe(!entered.has(n.id))
    }
  })

  it('names a node type and at least one setting for every step, for its settings panel', () => {
    for (const w of all)
      for (const n of w.nodes) {
        expect(n.type, `${w.code} ${n.id}`).not.toBe('')
        expect(n.settings.length, `${w.code} ${n.id}`).toBeGreaterThan(0)
      }
  })

  it('tests every workflow at least twice, twenty rows in all, each id once', () => {
    const ids = plan.tests.rows.map((r) => r.id)
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    for (const w of plan.workflows) {
      expect(plan.tests.rows.filter((r) => r.workflow === w.code).length, w.code).toBeGreaterThanOrEqual(2)
    }
    for (const r of plan.tests.rows) expect(plan.workflows.map((w) => w.code)).toContain(r.workflow)
  })

  it('lists five build phases without saying how long the build takes', () => {
    expect(plan.build.phases).toHaveLength(5)
    for (const p of plan.build.phases) expect(Object.keys(p).sort()).toEqual(['name', 'tasks'])
    expect(plan.meta.map(([k]) => k)).not.toContain('Build time')
    expect(plan.build.blurb).not.toMatch(/hour/i)
  })

  it('labels every node kind for the legend', () => {
    expect(Object.keys(KIND_LABELS).sort()).toEqual(['action', 'ai', 'approve', 'branch', 'end', 'helper', 'trigger', 'wait'])
  })

  it('discloses the client is fictional and never mentions GoHighLevel', () => {
    expect(plan.footer.note).toBe('A worked example. Trusted Mover is a fictional client.')
    expect(JSON.stringify(plan)).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
