import { isFake } from '@/lib/assistant/config'
import type { TurnRecord } from '@/lib/assistant/turn'

type Env = Record<string, string | undefined>

/** One finished turn to record: the conversation, the page it started on, what the visitor wrote and what the turn produced. */
export type LogEntry = { conversationId: string; page: string; userText: string; record: TurnRecord }

/** Records a finished turn in Supabase (conversation row, messages, lead flag). Never throws; a failure is only logged. */
export async function logTurn({ conversationId, page, userText, record }: LogEntry, env: Env = process.env): Promise<void> {
  if (isFake(env)) return
  const base = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) {
    console.warn('Assistant log skipped: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set')
    return
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const send = async (path: string, method: string, body: unknown, prefer?: string) => {
    const res = await fetch(`${base}/rest/v1/${path}`, { method, headers: prefer ? { ...headers, Prefer: prefer } : headers, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`${method} ${path.split('?')[0]} answered ${res.status}`)
  }
  try {
    await send('conversations?on_conflict=id', 'POST', { id: conversationId, first_page: page }, 'resolution=ignore-duplicates')
    await send('messages', 'POST', [
      { conversation_id: conversationId, role: 'user', content: userText },
      ...record.tools.map((t) => ({ conversation_id: conversationId, role: 'tool', content: t.result, tool_name: t.name, tool_input: t.input })),
      { conversation_id: conversationId, role: 'assistant', content: record.text, input_tokens: record.usage.input, output_tokens: record.usage.output },
    ])
    if (record.leadSent) await send(`conversations?id=eq.${encodeURIComponent(conversationId)}`, 'PATCH', { lead_captured: true })
  } catch (err) {
    console.error('Assistant log failed', err)
  }
}
