import { expect, it } from 'vitest'
import { releaseRenderer } from '@/lib/webgl'

it('frees GPU resources while the context is alive, then drops the context', () => {
  const calls: string[] = []
  releaseRenderer({ dispose: () => calls.push('dispose'), forceContextLoss: () => calls.push('lose') })
  expect(calls).toEqual(['dispose', 'lose'])
})
