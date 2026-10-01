import { describe, expect, it } from 'vitest'
import { agenticFramework as af } from '@/data/agenticFramework'
import { plan } from '@/data/buildPlan'
import { endToEnd } from '@/data/endToEnd'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

/** The tools a line names. A longer name wins, so “Claude Code” is not also “Claude”. */
function named(text: string): ToolId[] {
  let rest = text
  const found: ToolId[] = []
  for (const id of (Object.keys(TOOLS) as ToolId[]).sort((a, b) => TOOLS[b].name.length - TOOLS[a].name.length)) {
    if (!rest.includes(TOOLS[id].name)) continue
    found.push(id)
    rest = rest.split(TOOLS[id].name).join(' ')
  }
  return found.sort()
}

describe('which tools each step shows', () => {
  it('End-to-End: a step shows exactly the tools its label or sub-line names', () => {
    for (const s of endToEnd.steps) expect([...(s.tools ?? [])].sort(), s.id).toEqual(named(`${s.label} ${s.sub}`))
    expect(endToEnd.steps.filter((s) => s.tools).map((s) => s.id)).toEqual(['a1', 'a3', 'd2', 'd4', 'e3', 'g2', 'h1', 'j2', 'j3'])
  })

  it('Agentic: a loop step shows exactly the tools its label or sub-line names', () => {
    for (const s of af.loop.steps) expect([...(s.tools ?? [])].sort(), s.id).toEqual(named(`${s.label} ${s.sub}`))
    expect(af.loop.steps.find((s) => s.id === 'check')!.tools).toEqual(['codex', 'vs-code'])
  })

  it('Agentic: each tool tile carries its tool, and the hero chips are gone', () => {
    expect(af.tools.map((t) => t.tool)).toEqual(['claude-code', 'vs-code', 'codex'])
    for (const t of af.tools) expect(TOOLS[t.tool!].name).toBe(t.title)
    expect('stack' in af).toBe(false)
  })

  it('build plan: every node shows the services its sub-line names, or n8n when it names none', () => {
    const SERVICES: [string, ToolId][] = [['Supabase', 'supabase'], ['Gmail', 'gmail'], ['Sheets', 'google-sheets'], ['Telegram', 'telegram'], ['Stripe', 'stripe'], ['Claude', 'claude'], ['Cal.com', 'cal-com']]
    for (const w of [...plan.workflows, ...plan.helpers.list])
      for (const n of w.nodes) {
        const want = SERVICES.filter(([word]) => n.sub.includes(word)).map(([, id]) => id)
        expect(n.tools, `${w.code} ${n.id} (${n.sub})`).toEqual(want.length ? want : ['n8n'])
      }
  })

  it('never puts more than two badges on one step', () => {
    const all = [...endToEnd.steps, ...af.loop.steps, ...[...plan.workflows, ...plan.helpers.list].flatMap((w) => w.nodes)]
    for (const s of all) expect((s.tools ?? []).length, s.id).toBeLessThanOrEqual(2)
  })
})
