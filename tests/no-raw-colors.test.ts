import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { expect, it } from 'vitest'

const ROOTS = ['app', 'components', 'data', 'hooks', 'lib']
const ALLOWED = new Set(['app/globals.css'])
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g

function walk(dir: string): string[] {
  let out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.(tsx?|css)$/.test(name)) out.push(p.split(sep).join('/'))
  }
  return out
}

it('uses colours only through Kraft tokens (spec §3)', () => {
  const files = ROOTS.flatMap((r) => {
    try {
      return walk(r)
    } catch {
      return []
    }
  })
  const offenders = files
    .filter((f) => !ALLOWED.has(f))
    .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(RAW_COLOR)].map((m) => `${f}: ${m[0]}`))
  expect(offenders).toEqual([])
})
