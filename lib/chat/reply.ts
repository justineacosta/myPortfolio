/** The literal the model ends a reply with when the visitor shows buying interest. */
export const MARKER = '[[contact]]'

/** One run of reply text: plain, or a link to a known site path. */
export type Segment = { text: string } | { text: string; href: string }

/**
 * The reply as the visitor should see it, plus whether it asked for the
 * hand-off. Removes every marker, and a trailing partial one while it streams.
 */
export function splitReply(raw: string): { text: string; contact: boolean } {
  const contact = raw.includes(MARKER)
  let text = raw.split(MARKER).join('')
  for (let n = MARKER.length - 1; n >= 2; n--) {
    if (text.endsWith(MARKER.slice(0, n))) {
      text = text.slice(0, -n)
      break
    }
  }
  return { text: text.replace(/ {2,}/g, ' ').trim(), contact }
}

/**
 * Splits a reply into text and links. A `[label](path)` becomes a link only
 * when the path is in `known`; anything else (other sites, `javascript:`,
 * invented paths) stays as its label. The path may hold one level of
 * parentheses, so `javascript:alert(1)` is consumed whole, not left dangling.
 */
export function parseLinks(text: string, known: ReadonlySet<string>): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    out.push(known.has(m[2]) ? { text: m[1], href: m[2] } : { text: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}
