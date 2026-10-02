import Anthropic from '@anthropic-ai/sdk'
import { isFake, MAX_TOKENS, MODEL } from '@/lib/assistant/config'
import { fakeStreamTurn } from '@/lib/assistant/fake'

/** One call to Claude: the system prompt, the tools and the conversation so far. */
export type TurnRequest = { system: Anthropic.TextBlockParam[]; tools: Anthropic.Tool[]; messages: Anthropic.MessageParam[]; signal?: AbortSignal }

/** Streams one reply: calls `onText` with each text delta and resolves with the whole message. */
export type StreamTurn = (req: TurnRequest, onText: (delta: string) => void) => Promise<Anthropic.Message>

let client: Anthropic | undefined

/** The real Claude, or the scripted fake when ASSISTANT_FAKE=1. The SDK client is built on the first real call (it throws under jsdom). */
export const streamTurn: StreamTurn = async (req, onText) => {
  if (isFake()) return fakeStreamTurn(req, onText)
  client ??= new Anthropic()
  const stream = client.messages.stream({ model: MODEL, max_tokens: MAX_TOKENS, system: req.system, tools: req.tools, messages: req.messages }, { signal: req.signal })
  stream.on('text', onText)
  return await stream.finalMessage()
}
