import { describe, expect, it } from 'vitest'
import { encodeEvent, readEvents, type AssistantEvent } from '@/lib/assistant/events'

/** A stream that hands out the given text chunks one by one. */
function streamOf(...chunks: string[]) {
  const enc = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks) c.enqueue(enc.encode(chunk))
      c.close()
    },
  })
}

async function collect(body: ReadableStream<Uint8Array>) {
  const out: AssistantEvent[] = []
  for await (const e of readEvents(body)) out.push(e)
  return out
}

describe('assistant events', () => {
  it('encodes one event as a JSON line', () => {
    expect(encodeEvent({ type: 'done' })).toBe('{"type":"done"}\n')
  })

  it('reads events in order when a line is split across chunks', async () => {
    const a = encodeEvent({ type: 'text', delta: 'Hel' })
    const b = encodeEvent({ type: 'navigate', href: '/work', label: 'Work' })
    const joined = a + b + encodeEvent({ type: 'done' })
    const cut = a.length + 7
    const events = await collect(streamOf(joined.slice(0, cut), joined.slice(cut)))
    expect(events).toEqual([
      { type: 'text', delta: 'Hel' },
      { type: 'navigate', href: '/work', label: 'Work' },
      { type: 'done' },
    ])
  })

  it('skips a blank line', async () => {
    expect(await collect(streamOf('\n{"type":"done"}\n\n'))).toEqual([{ type: 'done' }])
  })

  it('yields nothing for a malformed line', async () => {
    expect(await collect(streamOf('{nope\n{"type":"lead","ok":true}\n'))).toEqual([{ type: 'lead', ok: true }])
  })

  it('reads a last line that has no trailing newline', async () => {
    expect(await collect(streamOf('{"type":"done"}'))).toEqual([{ type: 'done' }])
  })
})
