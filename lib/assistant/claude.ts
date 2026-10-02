import Anthropic from '@anthropic-ai/sdk'
import { isFake, MAX_TOKENS, MODEL } from '@/lib/assistant/config'
import { fakeStreamTurn } from '@/lib/assistant/fake'

/** One call to Claude: the system prompt, the tools and the conversation so far. */
export type TurnRequest = { system: Anthropic.TextBlockParam[]; tools: Anthropic.Tool[]; messages: Anthropic.MessageParam[]; tool_choice?: Anthropic.ToolChoice; signal?: AbortSignal }

/** Streams one reply: calls `onText` with each text delta and resolves with the whole message. */
export type StreamTurn = (req: TurnRequest, onText: (delta: string) => void) => Promise<Anthropic.Message>

let client: Anthropic | undefined

/** The real Claude, or the scripted fake when ASSISTANT_FAKE=1. The SDK client is built on the first real call (it throws under jsdom). */
export const streamTurn: StreamTurn = async (req, onText) => {
  if (isFake()) return fakeStreamTurn(req, onText)
  // The function stops at 30 seconds, so a call gives up at 25 and is tried once more at most (the SDK's defaults are 10 minutes and 2 retries).
  client ??= new Anthropic({ timeout: 25_000, maxRetries: 1 })
  const stream = client.messages.stream({ model: MODEL, max_tokens: MAX_TOKENS, system: req.system, tools: req.tools, messages: req.messages, ...(req.tool_choice ? { tool_choice: req.tool_choice } : {}) }, { signal: req.signal })
  stream.on('text', onText)
  return await stream.finalMessage()
}
