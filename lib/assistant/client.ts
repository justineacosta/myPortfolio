import { assistant } from '@/data/assistant'
import { readEvents, type AssistantEvent } from './events'
import type { ChatMessage, ChatRequest } from './limits'

const failed: AssistantEvent = { type: 'error', error: assistant.errors.failed }

/** Posts a chat turn and yields the events of the reply. A refusal or a network failure arrives as an `error` event. An abort ends the stream quietly. */
export async function* sendChat(body: ChatRequest, signal: AbortSignal): AsyncGenerator<AssistantEvent> {
  let res: Response
  try {
    res = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal })
  } catch {
    if (!signal.aborted) yield failed
    return
  }
  if (!res.ok) {
    let error: unknown
    try {
      error = ((await res.json()) as { error?: unknown }).error
    } catch {
      /* the body was not JSON */
    }
    yield typeof error === 'string' && error ? { type: 'error', error } : failed
    return
  }
  if (!res.body) {
    yield failed
    return
  }
  try {
    yield* readEvents(res.body)
  } catch {
    // The connection dropped mid-reply: the stream just ends, and the caller sees it stopped before `done`.
  }
}

/** What the form card collects. */
export type LeadFields = { firstName: string; lastName: string; email: string; message: string; call: boolean }

/** How sending the form card ended: sent, refused field by field, or failed (with the server's line when it gave one). */
export type LeadResult = { ok: true } | { ok: false; errors?: Partial<Record<'firstName' | 'lastName' | 'email' | 'message', string>>; error?: string }

const leadFields = ['firstName', 'lastName', 'email', 'message'] as const

/** Posts the form card to `/api/chat/lead`. A 400 with `errors` carries a sentence per bad field; any other failure, a network one included, carries one error line. */
export async function sendLead(body: LeadFields & { conversationId: string; page: string; messages: ChatMessage[] }): Promise<LeadResult> {
  const lost: LeadResult = { ok: false, error: assistant.leadFailed }
  try {
    const res = await fetch('/api/chat/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) return { ok: true }
    let data: { error?: unknown; errors?: unknown } = {}
    try {
      data = (await res.json()) as typeof data
    } catch {
      /* the body was not JSON */
    }
    if (res.status === 400 && typeof data.errors === 'object' && data.errors !== null) {
      const raw = data.errors as Record<string, unknown>
      const errors: Partial<Record<(typeof leadFields)[number], string>> = {}
      for (const f of leadFields) if (typeof raw[f] === 'string' && raw[f]) errors[f] = raw[f]
      if (Object.keys(errors).length > 0) return { ok: false, errors }
    }
    return { ok: false, error: typeof data.error === 'string' && data.error ? data.error : assistant.leadFailed }
  } catch {
    return lost
  }
}
