import { describe, expect, it } from 'vitest'
import { PACE, paced } from '@/lib/chat/pace'

/** Reads the whole stream, returning each piece as it arrived and every wait it asked for. */
async function run(text: string) {
  const waits: number[] = []
  const reader = paced(text, async (ms) => void waits.push(ms)).getReader()
  const decoder = new TextDecoder()
  const pieces: string[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    pieces.push(decoder.decode(value))
  }
  return { pieces, waits }
}

describe('paced', () => {
  it('waits before the first word, as if thinking', async () => {
    const { waits } = await run('Depends on the build.')
    expect(waits[0]).toBe(PACE.pauseMs)
    expect(PACE.pauseMs).toBe(900)
  })

  it('sends the reply word by word, and the words add back up to the reply exactly', async () => {
    const text = 'Depends on the build.\n\n[Get in touch](/contact)\n[[contact]]'
    const { pieces } = await run(text)
    expect(pieces.length).toBeGreaterThan(1)
    expect(pieces.join('')).toBe(text)
    expect(pieces[0]).toBe('Depends ')
  })

  it('types a short reply at the normal speed', async () => {
    const { waits } = await run('one two three')
    expect(waits).toEqual([PACE.pauseMs, PACE.stepMs, PACE.stepMs])
    expect(PACE.stepMs).toBe(30)
  })

  it('types a long reply faster, so the typing never runs past the cap', async () => {
    const { waits, pieces } = await run(Array.from({ length: 400 }, (_, i) => `w${i}`).join(' '))
    expect(pieces).toHaveLength(400)
    const typing = waits.slice(1).reduce((a, b) => a + b, 0)
    expect(typing).toBeLessThanOrEqual(PACE.maxMs)
    expect(PACE.maxMs).toBe(2000)
  })

  it('stops when the reader cancels', async () => {
    const waits: number[] = []
    const reader = paced('a b c d e', async (ms) => void waits.push(ms)).getReader()
    await reader.read()
    await reader.cancel()
    expect(waits.length).toBeLessThan(5)
  })
})
