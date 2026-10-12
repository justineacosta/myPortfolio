import Anthropic from '@anthropic-ai/sdk'
import { chat } from '@/data/chat'
import { clientIp } from '@/lib/leadLimit'
import { chatAllowed } from '@/lib/chat/limit'
import { systemBlocks } from '@/lib/chat/prompt'
import { localAnswer } from '@/lib/chat/local'
import { pageFor } from '@/lib/chat/pages'
import { checkChat } from '@/lib/chat/validate'

/**
 * Lumen's backend, ported from the old portfolio
 * (the myPortfolioV3 repo, src/app/api/assistant/route.ts). Two tiers:
 * - live: Claude (ANTHROPIC_MODEL, else Opus 5.5) answers from the cached
 *   system prompt (lib/chat/prompt.ts), streamed back as plain text;
 * - local: without a key, or when the call fails before its first word, the
 *   offline rules (lib/chat/local.ts) answer, streamed in small pieces so the
 *   panel can't tell the difference.
 * Both are told the page the visitor has open (lib/chat/pages.ts), when the
 * body names one the site shows. X-Assistant-Mode says which one answered. Only the live tier is rate
 * limited. Every refusal is { error: sentence } for the panel to show.
 */

export const maxDuration = 60

/** The largest request body read: far above 11 turns at their limits. */
const MAX_BODY = 64 * 1024

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'

const headers = (mode: 'live' | 'local') => ({ 'content-type': 'text/plain; charset=utf-8', 'x-assistant-mode': mode, 'cache-control': 'no-store' })

const refuse = (error: string, status: number) => Response.json({ error }, { status })

/** An offline answer, sent four characters at a time like a stream. */
function local(reply: string): Response {
  // [\s\S], not ., so line breaks survive the split.
  const pieces = reply.match(/[\s\S]{1,4}/g) ?? [reply]
  const encoder = new TextEncoder()
  let next = 0
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (next === pieces.length) return controller.close()
      await new Promise((r) => setTimeout(r, 14))
      controller.enqueue(encoder.encode(pieces[next++]))
    },
  })
  return new Response(body, { headers: headers('local') })
}

let client: Anthropic | undefined
/** The one SDK client, built on the first call so the key is read when it is needed. It never retries: a visitor is waiting. */
const anthropic = () => (client ??= new Anthropic({ timeout: 45_000, maxRetries: 0 }))

type StreamEvent = Anthropic.Beta.Messages.BetaRawMessageStreamEvent

/** The text of an event if it is a piece of the answer, else ''. */
const textOf = (event: StreamEvent) => (event.type === 'content_block_delta' && event.delta.type === 'text_delta' ? event.delta.text : '')

export async function POST(req: Request) {
  // No honest history is near this size, so a larger one is refused before it is read.
  const declared = Number(req.headers.get('content-length'))
  const sent: unknown = declared > MAX_BODY ? null : await req.json().catch(() => null)
  const messages = checkChat(sent)
  if (!messages) return refuse(chat.errors.invalid, 400)
  // Only a page the site shows is believed; anything else is no page at all.
  const page = pageFor((sent as { page?: unknown }).page)
  const offline = () => localAnswer(messages[messages.length - 1].content, page)

  // The offline tier costs nothing, so it answers before the limit is counted.
  if (!process.env.ANTHROPIC_API_KEY) return local(offline())
  if (!chatAllowed(clientIp(req))) return refuse(chat.errors.rate, 429)

  let stream: ReturnType<Anthropic['beta']['messages']['stream']>
  let events: AsyncIterator<StreamEvent>
  let first: IteratorResult<StreamEvent>
  try {
    stream = anthropic().beta.messages.stream({
      model: MODEL,
      // Caps thinking and the answer together; much lower and a question that makes it think can be cut mid-sentence.
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      // Portfolio questions aren't hard, and the wait is what a visitor feels.
      output_config: { effort: 'low' },
      // A declined answer is retried on the model Anthropic recommends for that kind of refusal.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: systemBlocks(page),
      messages,
    })
    events = stream[Symbol.asyncIterator]()
    first = await events.next()
  } catch (err) {
    console.error('Lumen: the call failed before the first event; the offline rules answer.', err)
    return local(offline())
  }

  const encoder = new TextEncoder()
  let event: IteratorResult<StreamEvent> | undefined = first
  let wrote = false
  const body = new ReadableStream<Uint8Array>({
    // Each pull reads on until a piece of text is ready, since an event that is not text enqueues nothing.
    async pull(controller) {
      try {
        for (;;) {
          event ??= await events.next()
          const { done, value } = event
          event = undefined
          if (done) break
          const text = textOf(value)
          if (text) {
            wrote = true
            return controller.enqueue(encoder.encode(text))
          }
        }
        const final = await stream.finalMessage()
        if (process.env.NODE_ENV === 'development') {
          console.info(`Lumen: ${final.model}, stop ${final.stop_reason}, cache read ${final.usage.cache_read_input_tokens}, written ${final.usage.cache_creation_input_tokens}.`)
        }
        // Nothing to show (a refusal the fallback couldn't rescue, or an empty answer): the offline rules answer instead.
        if (!wrote) controller.enqueue(encoder.encode(offline()))
      } catch (err) {
        console.error('Lumen: the call failed mid-answer.', err)
        controller.enqueue(encoder.encode(wrote ? `\n\n${chat.replies.interrupted}` : offline()))
      }
      controller.close()
    },
    // The visitor stopped the answer, closed the panel or left: stop paying for the rest.
    cancel: () => stream.abort(),
  })
  return new Response(body, { headers: headers('live') })
}
