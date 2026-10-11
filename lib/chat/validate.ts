/** One turn of the conversation, as the browser sends it and the model receives it. */
export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/** The most entries a history may hold: 10 visitor turns and the 9 answers between them. */
const MAX_TURNS = 19
/** The longest a turn may be, by who wrote it. */
const MAX_LENGTH = { user: 500, assistant: 2000 }

/**
 * The turns of a chat request body, trimmed and stripped to role and content,
 * or null when the history is not one the widget could have produced:
 * 1 to 19 entries, alternating, starting and ending on the visitor, each
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
