import type Anthropic from '@anthropic-ai/sdk'
import type { StreamTurn, TurnRequest } from '@/lib/assistant/claude'
import { EMAIL_RE } from '@/lib/contact'

const ANSWER = ['Justine builds full-stack apps, ', 'AI agents and automations. ', 'See [Services](/services).']

/** A message as the API would return it; the cast keeps the fake free of the SDK's many required fields. */
const message = (stop_reason: 'tool_use' | 'end_turn', content: unknown[]) =>
  ({ id: 'msg_fake', type: 'message', role: 'assistant', model: 'fake', content, stop_reason, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 5 } }) as unknown as Anthropic.Message

const text = (t: string) => message('end_turn', [{ type: 'text', text: t }])
const toolUse = (name: string, input: unknown) => message('tool_use', [{ type: 'tool_use', id: `toolu_fake_${name}`, name, input }])

/** The text of the latest visitor message (the last user message whose content is a string). */
function visitorText(messages: Anthropic.MessageParam[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === 'user' && typeof m.content === 'string') return m.content
  }
  return ''
}

/** Whether the conversation ends in tool results, which means the fake is answering a tool's follow-up. */
function afterToolResult(messages: Anthropic.MessageParam[]) {
  const last = messages[messages.length - 1]
  return last?.role === 'user' && Array.isArray(last.content) && last.content.some((b) => b.type === 'tool_result')
}

/** The scripted Claude for tests and ASSISTANT_FAKE=1: it answers by matching the visitor's latest message, with no network. */
export const fakeStreamTurn: StreamTurn = async (req: TurnRequest, onText) => {
  const said = visitorText(req.messages)
  if (afterToolResult(req.messages)) {
    const called = req.messages.flatMap((m) => (m.role === 'assistant' && Array.isArray(m.content) ? m.content : [])).findLast((b) => b.type === 'tool_use')
    const reply = called && 'name' in called && called.name === 'navigate' ? 'Here are Justine’s projects.' : 'Thanks, it’s sent. Justine will reply by email.'
    onText(reply)
    return text(reply)
  }
  if (/fail/i.test(said)) throw new Error('fake failure')
  // A reply that never comes, as when Claude's stream stalls: it ends only when the turn is aborted.
  if (/stall/i.test(said)) {
    return new Promise<Anthropic.Message>((_, reject) => {
      const stop = () => reject(req.signal?.reason ?? new Error('fake stall aborted'))
      if (req.signal?.aborted) stop()
      else req.signal?.addEventListener('abort', stop, { once: true })
    })
  }
  if (/show me|take me/i.test(said)) return toolUse('navigate', { href: '/projects', label: 'Projects' })
  const words = said.split(/\s+/).filter(Boolean)
  const email = words.find((w) => EMAIL_RE.test(w))
  if (email) {
    const rest = words.filter((w) => w !== email)
    return toolUse('submit_lead', { firstName: rest[0] ?? '', lastName: rest[1] ?? '', email, message: rest.slice(2).join(' ') })
  }
  if (/in mind/i.test(said)) {
    const reply = 'Happy to pass it on. What’s your first and last name, your email, and what you need?'
    onText(reply)
    return text(reply)
  }
  for (const chunk of ANSWER) onText(chunk)
  return text(ANSWER.join(''))
}
