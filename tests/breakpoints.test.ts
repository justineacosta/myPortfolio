import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'

it('JS uses the exact same shell breakpoint as the CSS `shell:` variant', () => {
  const css = readFileSync('app/globals.css', 'utf8')
  const bp = /--breakpoint-shell:\s*([^;]+);/.exec(css)?.[1].trim()
  expect(bp).toBeTruthy()
  expect(SHELL_MIN_QUERY).toBe(`(min-width: ${bp})`)
})
