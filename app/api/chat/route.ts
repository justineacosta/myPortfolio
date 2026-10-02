import { after } from 'next/server'
import { assistant } from '@/data/assistant'
import { enabled, isFake } from '@/lib/assistant/config'
import { encodeEvent, type AssistantEvent } from '@/lib/assistant/events'
import { checkChat, LIMITS, trimHistory } from '@/lib/assistant/limits'
import { logTurn } from '@/lib/assistant/log'
import { fakeMailer, leadLedger, resendMailer } from '@/lib/assistant/mail'
import { siteAssistant } from '@/lib/assistant/site'
import { runTurn, type TurnRecord } from '@/lib/assistant/turn'
import { clientIp, leadAllowed } from '@/lib/leadLimit'
import { rateLimit } from '@/lib/rateLimit'

/** The assistant's backend: checks the request, runs one turn over Claude and streams its events as newline JSON. Refusals before the stream are { error: sentence }; a failure inside it is an `error` event, then `done`. */

/** Seconds a turn may run: Claude's reply plus up to three tool rounds. */
export const maxDuration = 30

const allowed = rateLimit(LIMITS.rate)
const ledger = leadLedger()
const encoder = new TextEncoder()

const refuse = (error: string, status: number) => Response.json({ error }, { status })

/** Streams one assistant turn for a chat request. 503 when off, 429 over the rate limit, 400 for a bad request, else 200. */
export async function POST(req: Request): Promise<Response> {
  if (!enabled()) return refuse(assistant.errors.off, 503)
  const ip = clientIp(req)
  if (!allowed(ip)) return refuse(assistant.errors.rate, 429)

  const checked = checkChat(await req.json().catch(() => null))
  if (!checked.ok) return refuse(checked.error, 400)
  const { conversationId, page, messages } = checked.req
  const history = trimHistory(messages)
  const transcript = history.map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n')
  const userText = messages[messages.length - 1].content

  // The turn starts as the stream is built, so `turn` is set before `after` reads it. It resolves to null when the turn failed.
  let turn: Promise<TurnRecord | null> = Promise.resolve(null)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // The visitor may have left: writing to a cancelled stream throws, and there is nobody to tell.
      const emit = (e: AssistantEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeEvent(e)))
        } catch {}
      }
      turn = runTurn({
        config: siteAssistant(),
        history,
        ctx: { conversationId, transcript, mailer: isFake() ? fakeMailer : resendMailer(), ledger, mayLead: () => leadAllowed(ip) },
        emit,
        signal: req.signal,
      }).then(
        (record) => record,
        (err) => {
          console.error('Assistant: the turn failed.', err)
          emit({ type: 'error', error: assistant.errors.failed })
          return null
        },
      ).then((record) => {
        emit({ type: 'done' })
        try {
          controller.close()
        } catch {}
        return record
      })
    },
  })

  after(async () => {
    const record = await turn
    if (record) await logTurn({ conversationId, page, userText, record }).catch((err) => console.error('Assistant: logging the turn failed.', err))
  })

  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' } })
}
