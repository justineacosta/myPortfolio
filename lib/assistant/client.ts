import { assistant } from '@/data/assistant'
import { readEvents, type AssistantEvent } from './events'
import type { ChatRequest } from './limits'

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
