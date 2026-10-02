// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assistant } from '@/data/assistant'
import { contact } from '@/data/contact'
import { logTurn } from '@/lib/assistant/log'
import { POST } from '@/app/api/chat/lead/route'

// `after` runs outside a request here, so it only collects the work; the tests run it by hand.
const pending: (() => unknown)[] = []
vi.mock('next/server', async (orig) => ({ ...(await orig<typeof import('next/server')>()), after: (fn: () => unknown) => { pending.push(fn) } }))
vi.mock('@/lib/assistant/log', () => ({ logTurn: vi.fn().mockResolvedValue(undefined) }))

let ip = 0
/** Each lead is its own conversation unless a test says otherwise, because a conversation sends one lead. */
const id = () => crypto.randomUUID()
const good = (over: Record<string, unknown> = {}) => ({
  conversationId: id(),
  page: '/services',
  firstName: 'Ana',
  lastName: 'Reyes',
  email: 'ana@example.com',
  message: 'Our intake is manual.',
  call: false,
  messages: [
    { role: 'user', content: 'I have a project in mind' },
    { role: 'assistant', content: 'Want Justine to reply? Leave your details:' },
  ],
  ...over,
})
/** Each request comes from its own address unless one is given, so the limits stay out of the way. */
const post = (payload: unknown, from = `10.0.1.${++ip}`) =>
  POST(
    new Request('http://localhost/api/chat/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `${from}, 10.9.9.9` },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  )
const runAfter = () => Promise.all(pending.splice(0).map((f) => f()))

describe('POST /api/chat/lead', () => {
  let info: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    pending.length = 0
    vi.stubEnv('ASSISTANT_FAKE', '1')
    info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(logTurn).mockClear().mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends a good form through the fake mailer, answers 200 and logs a lead_form turn', async () => {
    const res = await post(good({ conversationId: '11111111-1111-4111-8111-111111111111' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(info).toHaveBeenCalledTimes(1)
    await runAfter()
    expect(logTurn).toHaveBeenCalledTimes(1)
    expect(logTurn).toHaveBeenCalledWith({
      conversationId: '11111111-1111-4111-8111-111111111111',
      page: '/services',
      userText: '',
      record: expect.objectContaining({
        engine: 'site',
        leadSent: true,
        text: '',
        tools: [expect.objectContaining({ name: 'lead_form', input: { call: false }, isError: false })],
      }),
    })
  })

  it('answers 400 with the field’s sentence for a missing last name', async () => {
    const res = await post(good({ lastName: '' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ errors: { lastName: contact.errors.lastName } })
    expect(info).not.toHaveBeenCalled()
  })

  it('answers 409 when the conversation already sent a lead', async () => {
    const same = good()
    expect((await post(same)).status).toBe(200)
    const res = await post(same)
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: assistant.quick.form.already })
    expect(info).toHaveBeenCalledTimes(1)
  })

  it('answers 429 on the 6th lead from one address', async () => {
    for (let i = 0; i < 5; i++) expect((await post(good(), '10.7.7.7')).status).toBe(200)
    const res = await post(good(), '10.7.7.7')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: assistant.errors.rate })
    expect(info).toHaveBeenCalledTimes(5)
  })

  describe('with the real mailer', () => {
    let fetch: ReturnType<typeof vi.fn>
    beforeEach(() => {
      vi.stubEnv('ASSISTANT_FAKE', '')
      vi.stubEnv('RESEND_API_KEY', 're_test')
      vi.stubEnv('CONTACT_FROM', 'Kraft <onboarding@resend.dev>')
      vi.stubEnv('CONTACT_TO', 'me@kraft.dev')
      fetch = vi.fn().mockResolvedValue(Response.json({ id: 'x' }))
      vi.stubGlobal('fetch', fetch)
    })

    it('answers 502 when the mailer fails, and a retry from the same conversation then goes through', async () => {
      const same = good()
      fetch.mockResolvedValue(new Response('boom', { status: 500 }))
      const failed = await post(same)
      expect(failed.status).toBe(502)
      expect(await failed.json()).toEqual({ error: assistant.leadFailed })
      await runAfter()
      expect(logTurn).not.toHaveBeenCalled()

      fetch.mockResolvedValue(Response.json({ id: 'x' }))
      expect((await post(same)).status).toBe(200)
    })

    it('tags a call request in the subject of the email to Justine', async () => {
      const res = await post(good({ call: true }))
      expect(res.status).toBe(200)
      const first = JSON.parse(fetch.mock.calls[0][1].body as string)
      expect(first.subject).toMatch(/^Call request from /)
      expect(first.text).toContain('Visitor: I have a project in mind')
      await runAfter()
      expect(vi.mocked(logTurn).mock.calls[0][0].record.tools[0].input).toEqual({ call: true })
    })
  })

  it('answers 400 for a bad conversation id, a bad page, bad messages and a body that is not JSON', async () => {
    for (const bad of [good({ conversationId: 'nope' }), good({ page: 'services' }), good({ messages: [] }), good({ call: 'yes' }), 'not json']) {
      const res = await post(bad)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: assistant.errors.bad })
    }
  })

  it('accepts a history that ends on an assistant message', async () => {
    expect((await post(good())).status).toBe(200)
  })
})
