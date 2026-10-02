import { assistant } from '@/data/assistant'

/** The assistant's limits: the rate limit per IP, the sizes and the turn counts. */
export const LIMITS = { rate: { limit: 20, windowMs: 600_000 }, messageChars: 1000, turns: 30, historyChars: 40_000, toolRounds: 3 }

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ChatRequest = { conversationId: string; page: string; messages: ChatMessage[] }

const bad = { ok: false as const, error: assistant.errors.bad }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Checks the browser's body and builds a fresh request from the checked fields. The browser's history is never trusted. */
export function checkChat(body: unknown): { ok: true; req: ChatRequest } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return bad
  const { conversationId, page, messages } = body as Record<string, unknown>
  if (typeof conversationId !== 'string' || !UUID.test(conversationId)) return bad
  if (typeof page !== 'string' || !page.startsWith('/') || page.length > 200) return bad
  if (!Array.isArray(messages) || messages.length === 0) return bad
  const clean: ChatMessage[] = []
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) return bad
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return bad
    clean.push({ role, content })
  }
  if (clean[clean.length - 1].role !== 'user') return bad
  const visitor = clean.filter((m) => m.role === 'user')
  // The API rejects empty content, so an empty visitor message is refused here rather than failing later.
  if (visitor.some((m) => !m.content.trim())) return bad
  if (visitor.some((m) => m.content.length > LIMITS.messageChars)) return { ok: false, error: assistant.errors.long }
  if (visitor.length > LIMITS.turns) return { ok: false, error: assistant.errors.turns }
  return { ok: true, req: { conversationId, page, messages: clean } }
}

/** Drops the oldest messages until the history fits, then any assistant message left at the front. */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  let total = messages.reduce((n, m) => n + m.content.length, 0)
  let start = 0
  while (start < messages.length - 1 && total > LIMITS.historyChars) total -= messages[start++].content.length
  while (start < messages.length - 1 && messages[start].role === 'assistant') start++
  return messages.slice(start)
}
