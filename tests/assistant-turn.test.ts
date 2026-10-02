// @vitest-environment node
import type Anthropic from '@anthropic-ai/sdk'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { fakeStreamTurn } from '@/lib/assistant/fake'
import type { AssistantEvent } from '@/lib/assistant/events'
import { LIMITS, type ChatMessage } from '@/lib/assistant/limits'
import { leadLedger, type Mailer } from '@/lib/assistant/mail'
import { systemBlocks } from '@/lib/assistant/prompt'
import { siteAssistant } from '@/lib/assistant/site'
import type { TurnContext } from '@/lib/assistant/tools'
import { runTurn, type StreamTurn } from '@/lib/assistant/turn'

const ANSWER = 'Justine builds full-stack apps, AI agents and automations. See [Services](/services).'

const message = (stop_reason: string, content: unknown[]) =>
  ({ id: 'msg_x', type: 'message', role: 'assistant', model: 'x', content, stop_reason, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 5 } }) as unknown as Anthropic.Message
const toolUse = (name: string, input: unknown, id = `tu_${name}`) => ({ type: 'tool_use', id, name, input })

describe('runTurn', () => {
  let mailer: Mock<Mailer>
  let ctx: TurnContext
  let events: AssistantEvent[]
  const emit = (e: AssistantEvent) => void events.push(e)
  const run = (text: string, stream?: StreamTurn, history: ChatMessage[] = [{ role: 'user', content: text }]) =>
    runTurn({ config: siteAssistant(), history, ctx, emit, stream: stream ?? fakeStreamTurn })

  beforeEach(() => {
    mailer = vi.fn<Mailer>().mockResolvedValue(undefined)
    ctx = { conversationId: 'c1', transcript: 'Visitor: hi', mailer, ledger: leadLedger(), mayLead: () => true }
    events = []
  })

  it('streams a plain answer as three text deltas and sums the usage', async () => {
    const record = await run('What do you build?')
    expect(events.map((e) => e.type)).toEqual(['text', 'text', 'text'])
    expect(events.map((e) => (e as { delta: string }).delta).join('')).toBe(ANSWER)
    expect(record.text).toBe(ANSWER)
    expect(record.usage).toEqual({ input: 10, output: 5 })
    expect(record.tools).toEqual([])
    expect(record.leadSent).toBe(false)
    expect(events.some((e) => e.type === 'done')).toBe(false)
  })

  it('runs navigate, emits its event, then streams the follow-up', async () => {
    const record = await run('Show me your projects')
    expect(events).toContainEqual({ type: 'navigate', href: '/projects', label: 'Projects' })
    expect(events[events.length - 1]).toEqual({ type: 'text', delta: 'Here are Justine’s projects.' })
    expect(record.text).toBe('Here are Justine’s projects.')
    expect(record.tools[0].name).toBe('navigate')
    expect(record.tools[0].isError).toBe(false)
    expect(record.usage.input).toBe(20)
  })

  it('sends a lead once and marks the record', async () => {
    const record = await run('Ana Reyes ana@example.com Our intake is manual')
    expect(mailer).toHaveBeenCalledTimes(1)
    expect(mailer.mock.calls[0][0]).toMatchObject({ firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual' })
    expect(events).toContainEqual({ type: 'lead', ok: true })
    expect(record.leadSent).toBe(true)
    expect(record.text).toBe('Thanks, it’s sent. Justine will reply by email.')
  })

  it('answers the project-in-mind chip with a question and no tool', async () => {
    const record = await run('I have a project in mind')
    expect(record.text).toContain('first and last name')
    expect(record.tools).toEqual([])
  })

  it('stops after the tool-round cap without running the extra round', async () => {
    const script = [toolUse('navigate', { href: '/projects', label: 'Projects' }), toolUse('request_call', {}), toolUse('submit_lead', {}), toolUse('navigate', { href: '/about', label: 'About' })]
    const stream = vi.fn<StreamTurn>().mockImplementation(async () => message('tool_use', [script[stream.mock.calls.length - 1]]))
    const record = await run('go', stream)
    expect(stream).toHaveBeenCalledTimes(LIMITS.toolRounds + 1)
    expect(record.tools).toHaveLength(LIMITS.toolRounds)
    expect(events.filter((e) => e.type === 'navigate')).toHaveLength(1)
  })

  it('refuses a second use of the same tool in one turn', async () => {
    let n = 0
    const stream = vi.fn<StreamTurn>().mockImplementation(async () => {
      n++
      return n <= 2 ? message('tool_use', [toolUse('navigate', { href: '/projects', label: 'Projects' }, `tu_${n}`)]) : message('end_turn', [{ type: 'text', text: 'ok' }])
    })
    const record = await run('go', stream)
    expect(events.filter((e) => e.type === 'navigate')).toHaveLength(1)
    expect(record.tools).toHaveLength(2)
    expect(record.tools[1].isError).toBe(true)
    expect(record.tools[1].result).toContain('once per turn')
    const secondRound = stream.mock.calls[2][0].messages
    const results = (secondRound[secondRound.length - 1].content as Anthropic.ToolResultBlockParam[])
    expect(results[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'tu_2', is_error: true })
  })

  it('runs a round’s tools one after another and sends all results in one message', async () => {
    const order: string[] = []
    const slow: Mailer = async () => {
      order.push('mail-start')
      await new Promise((r) => setTimeout(r, 20))
      order.push('mail-end')
    }
    ctx.mailer = slow
    const lead = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Hello there' }
    let n = 0
    const stream = vi.fn<StreamTurn>().mockImplementation(async () => {
      n++
      return n === 1 ? message('tool_use', [toolUse('submit_lead', lead, 'a'), toolUse('request_call', lead, 'b')]) : message('end_turn', [{ type: 'text', text: 'ok' }])
    })
    const record = await run('go', stream)
    expect(order).toEqual(['mail-start', 'mail-end'])
    expect(record.tools.map((t) => t.isError)).toEqual([false, true])
    const last = stream.mock.calls[1][0].messages.at(-1)!
    expect(last.role).toBe('user')
    expect((last.content as unknown[]).length).toBe(2)
  })

  it('returns an error result for an unknown tool', async () => {
    let n = 0
    const stream: StreamTurn = async () => (++n === 1 ? message('tool_use', [toolUse('nope', {})]) : message('end_turn', [{ type: 'text', text: 'ok' }]))
    const record = await run('go', stream)
    expect(record.tools[0]).toMatchObject({ name: 'nope', isError: true })
  })

  it('does not run tools when the reply hit max_tokens or was refused', async () => {
    for (const reason of ['max_tokens', 'refusal']) {
      events = []
      const stream = vi.fn<StreamTurn>().mockResolvedValue(message(reason, [toolUse('navigate', { href: '/projects', label: 'Projects' })]))
      const record = await run('go', stream)
      expect(stream).toHaveBeenCalledTimes(1)
      expect(record.tools).toEqual([])
      expect(events).toEqual([])
    }
  })

  it('rejects when the stream fails', async () => {
    await expect(run('please fail')).rejects.toThrow('fake failure')
  })

  it('sends the system prompt, the tools in order and the history to Claude', async () => {
    const config = siteAssistant()
    const stream = vi.fn<StreamTurn>().mockResolvedValue(message('end_turn', [{ type: 'text', text: 'hi' }]))
    const history: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'What do you build?' },
    ]
    const signal = new AbortController().signal
    await runTurn({ config, history, ctx, emit, stream, signal })
    const req = stream.mock.calls[0][0]
    expect(req.system).toEqual(systemBlocks(config.persona, config.knowledge))
    expect(req.tools.map((t) => t.name)).toEqual(['navigate', 'submit_lead', 'request_call'])
    expect(req.messages).toEqual(history)
    expect(req.signal).toBe(signal)
  })
})
