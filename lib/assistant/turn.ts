import type Anthropic from '@anthropic-ai/sdk'
import { streamTurn, type StreamTurn } from '@/lib/assistant/claude'
import type { AssistantEvent } from '@/lib/assistant/events'
import { LIMITS, type ChatMessage } from '@/lib/assistant/limits'
import type { AssistantConfig } from '@/lib/assistant/site'
import { systemBlocks } from '@/lib/assistant/prompt'
import type { TurnContext } from '@/lib/assistant/tools'

export type { StreamTurn }

/** What one turn did, for the transcript and the log: the reply, each tool call, the token counts and whether a lead went out, and which engine answered. */
export type TurnRecord = { text: string; tools: { name: string; input: unknown; result: string; isError: boolean }[]; usage: { input: number; output: number }; leadSent: boolean; engine: 'claude' | 'site' }

/** Runs one visitor turn: asks Claude, runs the tools it calls (up to LIMITS.toolRounds rounds) and streams events out through `emit`. It does not emit `done`. */
export async function runTurn(opts: { config: AssistantConfig; history: ChatMessage[]; ctx: TurnContext; emit: (e: AssistantEvent) => void; stream?: StreamTurn; signal?: AbortSignal }): Promise<TurnRecord> {
  const { config, ctx, emit, signal } = opts
  const stream = opts.stream ?? streamTurn
  const system = systemBlocks(config.persona, config.knowledge)
  const tools = config.tools.map((t) => t.def)
  const messages: Anthropic.MessageParam[] = opts.history.map((m) => ({ role: m.role, content: m.content }))
  const record: TurnRecord = { text: '', tools: [], usage: { input: 0, output: 0 }, leadSent: false, engine: 'claude' }
  const used = new Set<string>()
  // Text from a later tool round starts a new paragraph, so "Let me check." and "Here it is." do not run together.
  let roundHasText = false
  const onText = (delta: string) => {
    if (!roundHasText && record.text) {
      record.text += '\n\n'
      emit({ type: 'text', delta: '\n\n' })
    }
    roundHasText = true
    record.text += delta
    emit({ type: 'text', delta })
  }

  for (let round = 0; ; round++) {
    roundHasText = false
    // On the last round tools may no longer run, so Claude is told not to call one and must answer in text.
    const reply = await stream({ system, tools, messages: [...messages], signal, ...(round === LIMITS.toolRounds ? { tool_choice: { type: 'none' as const } } : {}) }, onText)
    record.usage.input += reply.usage.input_tokens
    record.usage.output += reply.usage.output_tokens
    messages.push({ role: 'assistant', content: reply.content })
    const calls = reply.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (reply.stop_reason !== 'tool_use' || calls.length === 0 || round >= LIMITS.toolRounds) return record

    const results: Anthropic.ToolResultBlockParam[] = []
    // One tool at a time: the lead ledger's check-then-add must not race, and "once per turn" must be deterministic.
    for (const call of calls) {
      const runner = config.tools.find((t) => t.def.name === call.name)
      let out: { result: string; isError: boolean }
      if (!runner) out = { result: `Unknown tool: ${call.name}.`, isError: true }
      else if (used.has(call.name)) out = { result: `The ${call.name} tool can be used once per turn and already was. Do not call it again.`, isError: true }
      else {
        used.add(call.name)
        const outcome = await runner.run(call.input, ctx)
        if (outcome.event) emit(outcome.event)
        if (outcome.lead) record.leadSent = true
        out = outcome
      }
      record.tools.push({ name: call.name, input: call.input, result: out.result, isError: out.isError })
      results.push({ type: 'tool_result', tool_use_id: call.id, content: out.result, ...(out.isError ? { is_error: true } : {}) })
    }
    messages.push({ role: 'user', content: results })
  }
}
