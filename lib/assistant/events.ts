/** What the chat route streams to the browser, one JSON object per line. */
export type AssistantEvent =
  | { type: 'text'; delta: string }
  | { type: 'navigate'; href: string; label: string }
  | { type: 'lead'; ok: boolean }
  | { type: 'source'; engine: 'site' }
  | { type: 'form' }
  | { type: 'error'; error: string }
  | { type: 'done' }

/** One event as a line of the stream. */
export function encodeEvent(e: AssistantEvent) {
  return JSON.stringify(e) + '\n'
}

/** Reads a response body as events. Blank and malformed lines are skipped. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AssistantEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let rest = ''
  const parse = (line: string): AssistantEvent | null => {
    if (!line.trim()) return null
    try {
      return JSON.parse(line) as AssistantEvent
    } catch {
      return null
    }
  }
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      rest += decoder.decode(value, { stream: true })
      const lines = rest.split('\n')
      rest = lines.pop() ?? ''
      for (const line of lines) {
        const e = parse(line)
        if (e) yield e
      }
    }
    const last = parse(rest + decoder.decode())
    if (last) yield last
  } finally {
    reader.releaseLock()
  }
}
