/**
 * The keyless fallback's replies are ready at once, which reads as canned. This
 * sends one the way Claude's arrive: a pause while the panel shows its "…",
 * then the words one by one. A long reply types faster, so the typing never
 * runs past `maxMs`.
 */
export const PACE = { pauseMs: 900, stepMs: 30, maxMs: 2000 }

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** `text` as a stream of words, after a pause. `wait` is the clock, swapped out in tests. */
export function paced(text: string, wait: (ms: number) => Promise<void> = sleep): ReadableStream<Uint8Array> {
  // Each piece is a word with the space after it, so the pieces join back to `text` exactly.
  const pieces = text.split(/(?<=\s)(?=\S)/)
  const step = Math.min(PACE.stepMs, Math.floor(PACE.maxMs / Math.max(pieces.length - 1, 1)))
  const encoder = new TextEncoder()
  let next = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (next === pieces.length) return controller.close()
      await wait(next === 0 ? PACE.pauseMs : step)
      controller.enqueue(encoder.encode(pieces[next++]))
    },
  })
}
