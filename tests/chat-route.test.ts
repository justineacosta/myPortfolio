import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chat } from '@/data/chat'
import { systemBlocks } from '@/lib/chat/prompt'
import { localAnswer } from '@/lib/chat/local'

const { streamMock } = vi.hoisted(() => ({ streamMock: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class { beta = { messages: { stream: streamMock } } } }))

import { POST } from '@/app/api/chat/route'

const QUESTION = 'What does Justine build?'
const MESSAGES = [{ role: 'user', content: QUESTION }]
let ip = 0
/** Each request comes from its own address unless one is given, so the rate limit stays out of the way. */
const post = (body: unknown, from = `10.1.0.${++ip}`) =>
  POST(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `${from}, 10.9.9.9` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
const delta = (text: string) => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })
const thinking = { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: '' } }
/** What `beta.messages.stream` returns: an async iterable of events, with the final message after them. */
const replying = (events: unknown[], failAfter?: Error) => ({
  async *[Symbol.asyncIterator]() {
    yield* events
    if (failAfter) throw failAfter
  },
  finalMessage: async () => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }),
  abort: vi.fn(),
})

/** Reads a response to the end, letting the offline tier's 14 ms pieces through on a fake clock. */
async function read(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let out = ''
  for (;;) {
    const next = reader.read()
    await vi.advanceTimersByTimeAsync(20)
    const { done, value } = await next
    if (done) return out + decoder.decode()
    out += decoder.decode(value, { stream: true })
  }
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test')
    vi.stubEnv('ANTHROPIC_MODEL', '')
    streamMock.mockReset()
    streamMock.mockReturnValue(replying([thinking, delta('Hel'), delta('lo')]))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('streams the live answer as plain text, marked live and not cached', async () => {
    const res = await post({ messages: MESSAGES })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(res.headers.get('x-assistant-mode')).toBe('live')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await read(res)).toBe('Hello')
  })

  it('asks Opus 5.5 with adaptive thinking at low effort, the default fallback, the cached prompt and the validated messages', async () => {
    await read(await post({ messages: [{ role: 'user', content: `  ${QUESTION} `, extra: 1 }] }))
    expect(streamMock).toHaveBeenCalledTimes(1)
    expect(streamMock.mock.calls[0][0]).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: systemBlocks(),
      messages: MESSAGES,
    })
  })

  it('answers from the offline rules without a key, marked local, and never calls the model', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const res = await post({ messages: MESSAGES })
    expect(res.headers.get('x-assistant-mode')).toBe('local')
    expect(await read(res)).toBe(localAnswer(QUESTION))
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('gives the offline rules the question before this one, so a follow-up has a topic', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const messages = [
      { role: 'user', content: 'I need my lead intake automated.' },
      { role: 'assistant', content: 'Yes: Automation & Workflows.' },
      { role: 'user', content: 'What would that look like?' },
    ]
    expect(await read(await post({ messages }))).toBe(localAnswer('What would that look like?', null, 'I need my lead intake automated.'))
  })

  it('answers from the offline rules when the call fails before its first event', async () => {
    streamMock.mockReturnValue(replying([], new Error('overloaded')))
    const res = await post({ messages: MESSAGES })
    expect(res.headers.get('x-assistant-mode')).toBe('local')
    expect(await read(res)).toBe(localAnswer(QUESTION))
  })

  it('ends a reply cut off mid-answer with the interrupted note, not a fake finish', async () => {
    streamMock.mockReturnValue(replying([delta('Half an ans')], new Error('dropped')))
    expect(await read(await post({ messages: MESSAGES }))).toBe(`Half an ans\n\n${chat.replies.interrupted}`)
  })

  it('answers from the offline rules when Claude sends no words at all (a refusal the fallback could not rescue)', async () => {
    streamMock.mockReturnValue(replying([thinking]))
    expect(await read(await post({ messages: MESSAGES }))).toBe(localAnswer(QUESTION))
  })

  it('tells Claude the page the visitor is on, after the cached prompt, and ignores a page the site does not show', async () => {
    streamMock.mockReturnValue(replying([delta('Hi.')]))
    await read(await post({ messages: MESSAGES, page: '/projects#build-plan' }))
    const system = streamMock.mock.calls.at(-1)![0].system
    expect(system).toHaveLength(2)
    expect(system[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(system[1].text).toContain('/projects#build-plan')
    expect(system[1].cache_control).toBeUndefined()
    for (const page of ['/admin', '/showcase', 42, 'x'.repeat(300)]) {
      await read(await post({ messages: MESSAGES, page }))
      expect(streamMock.mock.calls.at(-1)![0].system, String(page)).toEqual(systemBlocks())
    }
  })

  it('refuses a body it cannot read, a history that does not validate, and one declared over 64 KB', async () => {
    for (const body of [{ messages: [] }, '{not json', { messages: [{ role: 'assistant', content: 'Hi' }] }]) {
      const res = await post(body)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: chat.errors.invalid })
    }
    const big = await POST(
      new Request('http://localhost/api/chat', { method: 'POST', headers: { 'content-length': String(65 * 1024) }, body: JSON.stringify({ messages: MESSAGES }) }),
    )
    expect(big.status).toBe(400)
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('limits Claude to 30 questions an hour per visitor, and never limits the offline rules', async () => {
    for (let i = 0; i < 30; i++) expect((await post({ messages: MESSAGES }, '10.7.7.7')).status).toBe(200)
    const over = await post({ messages: MESSAGES }, '10.7.7.7')
    expect(over.status).toBe(429)
    expect(await over.json()).toEqual({ error: chat.errors.rate })
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect((await post({ messages: MESSAGES }, '10.7.7.7')).status).toBe(200)
  })
})
