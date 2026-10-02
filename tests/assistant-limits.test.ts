import { describe, expect, it } from 'vitest'
import { assistant } from '@/data/assistant'
import { checkChat, checkMessages, trimHistory, type ChatMessage } from '@/lib/assistant/limits'

const ID = '2f1e6c1a-8d2b-4c3e-9f00-1a2b3c4d5e6f'
const ok = { conversationId: ID, page: '/', messages: [{ role: 'user', content: 'Hi' }] }
const bad = { ok: false, error: assistant.errors.bad }

/** `n` visitor messages, alternating with assistant replies, ending on a visitor message. */
function turns(n: number) {
  const messages: ChatMessage[] = []
  for (let i = 0; i < n; i++) {
    if (i) messages.push({ role: 'assistant', content: 'ok' })
    messages.push({ role: 'user', content: 'Hi' })
  }
  return { ...ok, messages }
}

describe('checkChat', () => {
  it('accepts a well-formed request', () => {
    expect(checkChat(ok)).toEqual({ ok: true, req: { ...ok, formShown: false } })
  })

  it('reads formShown as true only when it is the boolean true', () => {
    expect(checkChat({ ...ok, formShown: true })).toMatchObject({ ok: true, req: { formShown: true } })
    expect(checkChat(ok)).toMatchObject({ ok: true, req: { formShown: false } })
    expect(checkChat({ ...ok, formShown: 'yes' })).toMatchObject({ ok: true, req: { formShown: false } })
  })

  it('builds a fresh request from the checked fields only', () => {
    const r = checkChat({ ...ok, extra: 'x', messages: [{ role: 'user', content: 'Hi', tool: 'y' }] })
    expect(r).toEqual({ ok: true, req: { ...ok, formShown: false } })
  })

  it('refuses a body that is not an object', () => {
    expect(checkChat('hi')).toEqual(bad)
    expect(checkChat(null)).toEqual(bad)
    expect(checkChat(undefined)).toEqual(bad)
  })

  it('refuses a conversation id that is not an id', () => {
    expect(checkChat({ ...ok, conversationId: 'x' })).toEqual(bad)
  })

  it('refuses a 36-character conversation id that is not a UUID', () => {
    expect(checkChat({ ...ok, conversationId: '-'.repeat(36) })).toEqual(bad)
    expect(checkChat({ ...ok, conversationId: 'a'.repeat(36) })).toEqual(bad)
    expect(checkChat({ ...ok, conversationId: '2f1e6c1a-8d2b-4c3e-9f00-1a2b3c4d5e6g' })).toEqual(bad)
    expect(checkChat({ ...ok, conversationId: '2f1e6c1a8d2b-4c3e-9f00-1a2b3c4d5e6f-' })).toEqual(bad)
  })

  it('accepts a UUID in either case', () => {
    expect(checkChat({ ...ok, conversationId: ID.toUpperCase() })).toEqual({ ok: true, req: { ...ok, conversationId: ID.toUpperCase(), formShown: false } })
  })

  it('refuses a page that is not a path on this site', () => {
    expect(checkChat({ ...ok, page: 'https://evil.test' })).toEqual(bad)
    expect(checkChat({ ...ok, page: '/' + 'a'.repeat(200) })).toEqual(bad)
  })

  it('refuses no messages', () => {
    expect(checkChat({ ...ok, messages: [] })).toEqual(bad)
  })

  it('refuses a role other than user or assistant', () => {
    expect(checkChat({ ...ok, messages: [{ role: 'system', content: 'Hi' }] })).toEqual(bad)
    expect(checkChat({ ...ok, messages: [{ role: 'tool', content: 'Hi' }] })).toEqual(bad)
  })

  it('refuses content that is not a string', () => {
    expect(checkChat({ ...ok, messages: [{ role: 'user', content: 5 }] })).toEqual(bad)
    expect(checkChat({ ...ok, messages: [{ role: 'user', content: [{ type: 'tool_result' }] }] })).toEqual(bad)
  })

  it('refuses an empty or whitespace-only visitor message', () => {
    expect(checkChat({ ...ok, messages: [{ role: 'user', content: '' }] })).toEqual(bad)
    expect(checkChat({ ...ok, messages: [{ role: 'user', content: '   ' }] })).toEqual(bad)
    const earlier = [{ role: 'user', content: ' \n' }, { role: 'assistant', content: 'Hello' }, { role: 'user', content: 'Hi' }]
    expect(checkChat({ ...ok, messages: earlier })).toEqual(bad)
  })

  it('refuses a conversation that does not end on the visitor', () => {
    const messages = [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]
    expect(checkChat({ ...ok, messages })).toEqual(bad)
  })

  it('refuses a visitor message over 1,000 characters', () => {
    const long = { ...ok, messages: [{ role: 'user', content: 'a'.repeat(1001) }] }
    expect(checkChat(long)).toEqual({ ok: false, error: assistant.errors.long })
    const edge = { ...ok, messages: [{ role: 'user', content: 'a'.repeat(1000) }] }
    expect(checkChat(edge)).toEqual({ ok: true, req: { ...edge, formShown: false } })
  })

  it('refuses a conversation past 30 visitor turns', () => {
    expect(checkChat(turns(31))).toEqual({ ok: false, error: assistant.errors.turns })
    expect(checkChat(turns(30))).toEqual({ ok: true, req: { ...turns(30), formShown: false } })
  })
})

describe('checkMessages', () => {
  const pair = [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }]

  it('accepts a history that ends on the assistant when endOnUser is false', () => {
    expect(checkMessages(pair, false)).toEqual({ ok: true, messages: pair })
  })

  it('refuses the same history when endOnUser is true', () => {
    expect(checkMessages(pair, true)).toEqual(bad)
  })
})

describe('trimHistory', () => {
  it('drops the oldest messages to fit, keeps the last, and starts on the visitor', () => {
    const messages: ChatMessage[] = Array.from({ length: 60 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'a'.repeat(1000) }))
    const out = trimHistory(messages)
    expect(out.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(40_000)
    expect(out.at(-1)).toBe(messages.at(-1))
    expect(out[0].role).toBe('user')
  })

  it('drops an assistant message left at the front by the trim', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'a'.repeat(20_000) },
      { role: 'assistant', content: 'b'.repeat(15_000) },
      { role: 'user', content: 'c'.repeat(10_000) },
      { role: 'assistant', content: 'd'.repeat(10_000) },
      { role: 'user', content: 'e' },
    ]
    // The first goes to fit; the assistant message that would lead goes too.
    expect(trimHistory(messages).map((m) => m.content[0])).toEqual(['c', 'd', 'e'])
  })

  it('leaves a short history alone', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hi' }]
    expect(trimHistory(messages)).toEqual(messages)
  })
})
