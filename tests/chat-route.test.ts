import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chat } from '@/data/chat'
import { fallbackReply } from '@/lib/chat/fallback'
import { systemBlocks } from '@/lib/chat/prompt'

const { streamMock } = vi.hoisted(() => ({ streamMock: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { stream: streamMock } } }))

import { POST } from '@/app/api/chat/route'

const MESSAGES = [{ role: 'user', content: 'What does Justine build?' }]
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
/** What `messages.stream` returns: an async iterable of events, with the final message after them. */
const replying = (events: unknown[], failAfter?: Error) => ({
  async *[Symbol.asyncIterator]() {
    yield* events
    if (failAfter) throw failAfter
  },
  finalMessage: async () => ({ usage: { cache_read_input_tokens: 120, cache_creation_input_tokens: 0 } }),
})

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test')
    streamMock.mockReset()
    streamMock.mockReturnValue(replying([delta('Hel'), delta('lo')]))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('streams the answer as plain text', async () => {
    const res = await post({ messages: MESSAGES })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await res.text()).toBe('Hello')
  })

  it('asks Haiku with low effort, the cached system blocks and the validated messages', async () => {
    await (await post({ messages: [{ role: 'user', content: '  What does Justine build? ', extra: 1 }] })).text()
    expect(streamMock).toHaveBeenCalledTimes(1)
    expect(streamMock.mock.calls[0][0]).toEqual({
      model: 'claude-haiku-5-5',
      max_tokens: 1000,
      output_config: { effort: 'low' },
      system: systemBlocks(),
      messages: MESSAGES,
    })
  })

  it('refuses a body it cannot read, and a history that does not validate', async () => {
    for (const body of [{ messages: [] }, '{not json', { messages: [{ role: 'assistant', content: 'Hi' }] }]) {
      const res = await post(body)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: chat.errors.invalid })
    }
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('refuses a body declared over 64 KB before reading it, and does not call the model', async () => {
    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': '65537', 'x-forwarded-for': `10.1.1.${++ip}` },
        body: JSON.stringify({ messages: MESSAGES }),
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: chat.errors.invalid })
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('answers from the fallback without a key, and does not call the model', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const res = await post({ messages: [{ role: 'user', content: 'How much do you charge?' }] })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(await res.text()).toBe(fallbackReply('How much do you charge?'))
    expect(streamMock).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('answers the latest question, not an earlier one, from the fallback', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const history = [
      { role: 'user', content: 'How much do you charge?' },
      { role: 'assistant', content: 'It depends on the build.' },
      { role: 'user', content: 'What is your process?' },
    ]
    expect(await (await post({ messages: history })).text()).toBe(fallbackReply('What is your process?'))
  })

  it('refuses the 21st request from one address within the hour', async () => {
    for (let i = 0; i < 20; i++) expect(await (await post({ messages: MESSAGES }, '10.2.0.1')).text()).toBe('Hello')
    streamMock.mockClear()
    const res = await post({ messages: MESSAGES }, '10.2.0.1')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: chat.errors.rate })
    expect(streamMock).not.toHaveBeenCalled()
  })

  it('answers from the fallback when the call fails before the first event, and logs why', async () => {
    streamMock.mockReturnValue(replying([], new Error('401 invalid x-api-key')))
    const res = await post({ messages: MESSAGES })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(fallbackReply(MESSAGES[0].content))
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('answers from the fallback when starting the call throws', async () => {
    streamMock.mockImplementation(() => {
      throw new Error('bad request')
    })
    const res = await post({ messages: MESSAGES })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(fallbackReply(MESSAGES[0].content))
  })

  it('errors the stream, so the reader sees a failure and not a short answer, when the call fails midway', async () => {
    streamMock.mockReturnValue(replying([delta('Hel')], new Error('dropped')))
    const res = await post({ messages: MESSAGES })
    expect(res.status).toBe(200)
    await expect(res.text()).rejects.toThrow('dropped')
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('mid-answer'), expect.any(Error))
  })

  it('logs the cache usage in development only', async () => {
    await (await post({ messages: MESSAGES })).text()
    expect(console.info).not.toHaveBeenCalled()
    vi.stubEnv('NODE_ENV', 'development')
    await (await post({ messages: MESSAGES })).text()
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('cache read 120, cache written 0'))
  })

  it('skips events that are not text', async () => {
    streamMock.mockReturnValue(replying([{ type: 'message_start' }, delta('Hi'), { type: 'content_block_stop', index: 0 }]))
    expect(await (await post({ messages: MESSAGES })).text()).toBe('Hi')
  })
})
