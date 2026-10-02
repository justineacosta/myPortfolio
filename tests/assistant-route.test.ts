// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assistant } from '@/data/assistant'
import { readEvents, type AssistantEvent } from '@/lib/assistant/events'
import { logTurn } from '@/lib/assistant/log'
import { fakeMailer } from '@/lib/assistant/mail'
import { POST } from '@/app/api/chat/route'

// `after` runs outside a request here, so it only collects the work; the tests run it by hand.
const pending: (() => unknown)[] = []
vi.mock('next/server', async (orig) => ({ ...(await orig<typeof import('next/server')>()), after: (fn: () => unknown) => { pending.push(fn) } }))
vi.mock('@/lib/assistant/mail', async (orig) => {
  const real = await orig<typeof import('@/lib/assistant/mail')>()
  return { ...real, fakeMailer: vi.fn(real.fakeMailer) }
})
vi.mock('@/lib/assistant/log', () => ({ logTurn: vi.fn().mockResolvedValue(undefined) }))

let ip = 0
/** A conversation id each request can use; a lead is sent once per conversation, so tests must not share one. */
const id = () => crypto.randomUUID()
const body = (text: string, conversationId = id()) => ({ conversationId, page: '/services', messages: [{ role: 'user', content: text }] })
/** Each request comes from its own address unless one is given, so the rate limit stays out of the way. */
const post = (payload: unknown, from = `10.0.0.${++ip}`) =>
  POST(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `${from}, 10.9.9.9` },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  )
const events = async (res: Response) => {
  const out: AssistantEvent[] = []
  for await (const e of readEvents(res.body!)) out.push(e)
  return out
}
const runAfter = () => Promise.all(pending.splice(0).map((f) => f()))

describe('POST /api/chat', () => {
  let fetch: ReturnType<typeof vi.fn>
  let info: ReturnType<typeof vi.spyOn>
  let error: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    pending.length = 0
    vi.stubEnv('ASSISTANT_FAKE', '1')
    fetch = vi.fn().mockResolvedValue(Response.json({ id: 'x' }))
    vi.stubGlobal('fetch', fetch)
    info = vi.spyOn(console, 'info').mockImplementation(() => {})
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fakeMailer).mockClear()
    vi.mocked(logTurn).mockClear().mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('streams the reply as newline JSON, text first and done last', async () => {
    const res = await post(body('Hi'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/x-ndjson')
    expect(res.headers.get('cache-control')).toBe('no-store')
    const all = await events(res)
    expect(all.slice(0, -1).every((e) => e.type === 'text')).toBe(true)
    expect(all.length).toBeGreaterThan(1)
    expect(all.at(-1)).toEqual({ type: 'done' })
    expect(all.flatMap((e) => (e.type === 'text' ? [e.delta] : [])).join('')).toContain('Justine builds')
  })

  it('sends a navigate event before done', async () => {
    const all = await events(await post(body('Show me your projects')))
    const at = all.findIndex((e) => e.type === 'navigate')
    expect(all[at]).toEqual({ type: 'navigate', href: '/projects', label: 'Projects' })
    expect(at).toBeLessThan(all.length - 1)
    expect(all.at(-1)).toEqual({ type: 'done' })
  })

  it('sends a lead through the fake mailer: logged, nothing emailed', async () => {
    const all = await events(await post(body('Ana Reyes ana@example.com Our intake is manual.')))
    expect(all).toContainEqual({ type: 'lead', ok: true })
    expect(info).toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('answers a failed turn with an error event, then done, still status 200', async () => {
    const res = await post(body('fail'))
    expect(res.status).toBe(200)
    expect(await events(res)).toEqual([{ type: 'error', error: assistant.errors.failed }, { type: 'done' }])
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Assistant'), expect.any(Error))
  })

  it('answers 503 when there is no key and no fake', async () => {
    vi.stubEnv('ASSISTANT_FAKE', '')
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const res = await post(body('Hi'))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: assistant.errors.off })
  })

  it('answers 429 on the 21st request from one address', async () => {
    for (let i = 0; i < 20; i++) expect((await post(body('Hi'), '10.1.1.1')).status).toBe(200)
    const res = await post(body('Hi'), '10.1.1.1')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: assistant.errors.rate })
  })

  it('answers 400 for a body that is not a chat request, and for one that is not JSON', async () => {
    for (const bad of [{ nope: true }, 'not json']) {
      const res = await post(bad)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: assistant.errors.bad })
    }
  })

  it('answers 400 for an empty message, a message over 1,000 characters and a conversation past 30 turns', async () => {
    const empty = await post(body('   '))
    expect(empty.status).toBe(400)
    expect(await empty.json()).toEqual({ error: assistant.errors.bad })
    const long = await post(body('a'.repeat(1001)))
    expect(long.status).toBe(400)
    expect(await long.json()).toEqual({ error: assistant.errors.long })
    const many = body('Hi')
    many.messages = Array.from({ length: 31 }, () => ({ role: 'user', content: 'Hi' }))
    const turns = await post(many)
    expect(turns.status).toBe(400)
    expect(await turns.json()).toEqual({ error: assistant.errors.turns })
  })

  it('builds the lead transcript from the history, one line per message', async () => {
    const payload = {
      conversationId: id(),
      page: '/',
      messages: [
        { role: 'user', content: 'I have a project in mind' },
        { role: 'assistant', content: 'Happy to pass it on.' },
        { role: 'user', content: 'Ana Reyes ana@example.com Our intake is manual.' },
      ],
    }
    const all = await events(await post(payload))
    expect(all).toContainEqual({ type: 'lead', ok: true })
    expect(fakeMailer).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }), {
      call: false,
      transcript: 'Visitor: I have a project in mind\nAssistant: Happy to pass it on.\nVisitor: Ana Reyes ana@example.com Our intake is manual.',
    })
  })

  it('logs the turn once, after the response, with the conversation, page, visitor text and a record', async () => {
    const conversationId = id()
    await events(await post(body('Hi', conversationId)))
    await runAfter()
    expect(logTurn).toHaveBeenCalledTimes(1)
    expect(logTurn).toHaveBeenCalledWith({
      conversationId,
      page: '/services',
      userText: 'Hi',
      record: expect.objectContaining({ text: expect.stringContaining('Justine builds'), leadSent: false }),
    })
  })

  it('does not log a turn that failed', async () => {
    await events(await post(body('fail')))
    await runAfter()
    expect(logTurn).not.toHaveBeenCalled()
  })

  it('leaves the response unchanged when logging rejects', async () => {
    vi.mocked(logTurn).mockRejectedValue(new Error('db down'))
    const all = await events(await post(body('Hi')))
    expect(all.at(-1)).toEqual({ type: 'done' })
    await expect(runAfter()).resolves.toBeDefined()
  })
})
