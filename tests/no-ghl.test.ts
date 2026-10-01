import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { expect, it } from 'vitest'

const ROOTS = ['app', 'components', 'data', 'hooks', 'lib']
const FILES = ['public/build-plan.html', 'public/end-to-end.html', 'public/agentic-framework.html', 'public/ai-agents.html', 'public/automations.html']
const GHL = /gohighlevel|highlevel|\bghl\b/i

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?|css|html)$/.test(name) ? [p.split(sep).join('/')] : []
  })
}

it('never mentions GoHighLevel: Justine builds on n8n', () => {
  const files = [...ROOTS.flatMap(walk), ...FILES]
  const offenders = files.flatMap((f) =>
    readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, i) => (GHL.test(line) ? [`${f}:${i + 1}`] : [])),
  )
  expect(offenders).toEqual([])
})
