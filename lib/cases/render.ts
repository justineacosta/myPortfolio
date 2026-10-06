import { CASES, type CaseSet } from '../../data/cases/index.ts'
import { CASE_PAGES, casePath, type CasePageId } from '../../data/cases/pages.ts'
import { renderAgenticFramework } from '../agenticFramework/render.ts'
import { renderAgents } from '../agents/render.ts'
import { renderAutomations } from '../automations/render.ts'
import { renderPlan } from '../buildPlan/render.ts'
import { renderEndToEnd } from '../endToEnd/render.ts'

/** Each page id's renderer, fed the content that case has for it (or nothing). */
const RENDER: Record<CasePageId, (set: CaseSet) => string | undefined> = {
  automation: (s) => s.automation && renderAutomations(s.automation),
  'build-plan': (s) => s.plan && renderPlan(s.plan),
  'agentic-framework': (s) => s.framework && renderAgenticFramework(s.framework),
  'end-to-end': (s) => s.endToEnd && renderEndToEnd(s.endToEnd),
  'ai-agents': (s) => s.agents && renderAgents(s.agents),
}

/** Every page every case has, as its path under public/ and its HTML. Pure: it writes nothing. */
export function renderCases(cases: Record<string, CaseSet> = CASES): { path: string; html: string }[] {
  const out: { path: string; html: string }[] = []
  for (const [key, set] of Object.entries(cases))
    for (const p of CASE_PAGES) {
      const html = RENDER[p.id](set)
      if (html !== undefined) out.push({ path: casePath(key, p.file), html })
    }
  return out
}
