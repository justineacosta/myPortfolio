/** One turn of the conversation, as the browser sends it and the model receives it. */
export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/**
 * The most turns a request carries: the latest question and the ten turns
 * before it. Odd, so the history the widget sends always starts on the visitor.
 */
export const MAX_TURNS = 11
/** The longest a sent turn may be. The widget cuts longer ones before sending. */
export const MAX_LENGTH = { user: 1500, assistant: 8000 }

/** The last `MAX_TURNS` turns of a conversation that ends on the visitor, each cut to its length. */
export function recent(turns: ChatTurn[]): ChatTurn[] {
  return turns.slice(-MAX_TURNS).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_LENGTH[t.role]) }))
}

/**
 * The turns of a chat request body, trimmed and stripped to role and content,
 * or null when the history is not one the widget could have produced:
 * 1 to 11 entries, alternating, starting and ending on the visitor, each
 * non-blank and within its length. A hand-made POST gets no more than that.
 */
export function checkChat(body: unknown): ChatTurn[] | null {
  const list = (body as { messages?: unknown } | null)?.messages
  if (!Array.isArray(list) || list.length < 1 || list.length > MAX_TURNS) return null
  const turns: ChatTurn[] = []
  for (const [i, entry] of list.entries()) {
    const { role, content } = (entry ?? {}) as { role?: unknown; content?: unknown }
    // Visitor turns sit at even positions and answers at odd ones, so order is never taken from the sender.
    const expected = i % 2 === 0 ? 'user' : 'assistant'
    if (role !== expected || typeof content !== 'string') return null
    const text = content.trim()
    if (!text || text.length > MAX_LENGTH[expected]) return null
    turns.push({ role: expected, content: text })
  }
  return turns.at(-1)!.role === 'user' ? turns : null
}
