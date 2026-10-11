import Anthropic from '@anthropic-ai/sdk'
import { chat } from '@/data/chat'
import { clientIp } from '@/lib/leadLimit'
import { chatAllowed } from '@/lib/chat/limit'
import { systemBlocks } from '@/lib/chat/prompt'
import { checkChat } from '@/lib/chat/validate'

/**
 * The site chat's backend: answers a visitor's question from the knowledge
 * block (lib/chat/knowledge.ts) with Claude Haiku, streamed back as plain text.
 * The order is: the per-visitor limit, the history check, the key, the call.
 * The first event is awaited before the Response goes out, so a call that
 * fails up front is a 502 the panel can show. A failure after that errors
 * the stream, and the panel shows the error sentence and the hand-off.
 * Every refusal is { error: sentence } for the panel to show.
 */

export const maxDuration = 30

const refuse = (error: string, status: number) => Response.json({ error }, { status })

let client: Anthropic | undefined
/** The one SDK client, built on the first call so the key is read when it is needed. It never retries: a visitor is waiting. */
const anthropic = () => (client ??= new Anthropic({ timeout: 20_000, maxRetries: 0 }))

/** The text of an event if it is a piece of the answer, else ''. */
const textOf = (event: Anthropic.MessageStreamEvent) =>
  event.type === 'content_block_delta' && event.delta.type === 'text_delta' ? event.delta.text : ''

export async function POST(req: Request) {
  if (!chatAllowed(clientIp(req))) return refuse(chat.errors.rate, 429)

  const messages = checkChat(await req.json().catch(() => null))
  if (!messages) return refuse(chat.errors.invalid, 400)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Site chat: ANTHROPIC_API_KEY is not set.')
    return refuse(chat.errors.unavailable, 503)
  }

  let stream: ReturnType<Anthropic['messages']['stream']>
  let events: AsyncIterator<Anthropic.MessageStreamEvent>
  let first: IteratorResult<Anthropic.MessageStreamEvent>
  try {
    stream = anthropic().messages.stream({
      model: 'claude-haiku-5-5',
      max_tokens: 1000,
      output_config: { effort: 'low' },
      system: systemBlocks(),
      messages,
    })
    events = stream[Symbol.asyncIterator]()
    first = await events.next()
  } catch (err) {
    console.error('Site chat: the call failed before the first event.', err)
    return refuse(chat.errors.failed, 502)
  }

  const encoder = new TextEncoder()
  let event: IteratorResult<Anthropic.MessageStreamEvent> | undefined = first
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
          if (text) return controller.enqueue(encoder.encode(text))
        }
        if (process.env.NODE_ENV === 'development') {
          const { usage } = await stream.finalMessage()
          console.info(`Site chat: cache read ${usage.cache_read_input_tokens}, cache written ${usage.cache_creation_input_tokens}.`)
        }
      } catch (err) {
        console.error('Site chat: the call failed mid-answer.', err)
        // The reader must see a failure, not a short answer that looks finished.
        return controller.error(err)
      }
      controller.close()
    },
    // The visitor closed the panel or left: stop paying for the rest of the answer.
    cancel: () => stream.abort(),
  })
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
