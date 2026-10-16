import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/contact/route'
import { contact } from '@/data/contact'

const GOOD = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.', website: '' }
let ip = 0
/** Each request comes from its own address unless one is given, so the rate limit stays out of the way. */
const post = (body: unknown, from = `10.0.0.${++ip}`) =>
  POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `${from}, 10.9.9.9` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
const sent = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.map(([url, init]) => ({ url, auth: init.headers.Authorization, ...JSON.parse(init.body) }))

describe('POST /api/contact', () => {
  let fetch: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('CONTACT_FROM', 'Kraft <onboarding@resend.dev>')
    vi.stubEnv('CONTACT_TO', 'me@kraft.dev')
    fetch = vi.fn().mockResolvedValue(Response.json({ id: 'x' }))
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('emails me the message, with Reply-To the visitor, then sends the visitor a confirmation', async () => {
    const res = await post(GOOD)
    expect(res.status).toBe(200)
    const [mine, theirs] = sent(fetch)
    expect(mine).toMatchObject({
      url: 'https://api.resend.com/emails',
      auth: 'Bearer re_test',
      from: 'Kraft Contact Form <onboarding@resend.dev>',
      to: ['me@kraft.dev'],
      reply_to: 'ana@example.com',
      subject: 'Project inquiry from Ana Reyes',
    })
    expect(mine.text).toContain('Our intake is manual.')
    expect(mine.html).toContain('Reply to Ana')
    expect(theirs).toMatchObject({ from: 'Justine at Kraft <onboarding@resend.dev>', to: ['ana@example.com'], reply_to: 'me@kraft.dev', subject: "Thanks for your message. I'll reply within one business day" })
    expect(theirs.text).toContain('Hi there,')
    // Not even the name: a stranger's address must never receive words someone else chose.
    expect(`${theirs.subject}${theirs.text}${theirs.html}`).not.toContain('Ana')
    expect(theirs.html).toContain('/projects"')
    expect(theirs.html).not.toContain('Our intake is manual.')
    // The confirmation never repeats what was typed, so the form cannot be used to mail someone else's words.
    expect(theirs.text).not.toContain('Our intake is manual.')
  })

  it('takes only the address from CONTACT_FROM, bare or named', async () => {
    vi.stubEnv('CONTACT_FROM', ' hello@kraft.dev ')
    await post(GOOD)
    expect(sent(fetch).map((m) => m.from)).toEqual(['Kraft Contact Form <hello@kraft.dev>', 'Justine at Kraft <hello@kraft.dev>'])
  })

  it('still counts as sent when only the confirmation fails', async () => {
    fetch.mockResolvedValueOnce(Response.json({ id: 'x' })).mockResolvedValueOnce(Response.json({ message: 'domain not verified' }, { status: 403 }))
    expect((await post(GOOD)).status).toBe(200)
  })

  it('says it failed when my copy could not be sent, and sends nothing else', async () => {
    fetch.mockResolvedValue(Response.json({ message: 'nope' }, { status: 500 }))
    const res = await post(GOOD)
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: contact.errors.failed })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('says it failed, without calling Resend, when the key or an address is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const res = await post(GOOD)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: contact.errors.failed })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('refuses a message with a missing or bad field, naming the first one', async () => {
    const res = await post({ ...GOOD, email: 'ana@' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: contact.errors.emailFormat })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('refuses a body that is not JSON', async () => {
    const res = await post('not json')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: contact.errors.firstName })
  })

  it('answers a filled honeypot as if it worked, and sends nothing', async () => {
    const res = await post({ ...GOOD, website: 'spam.example' })
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('lets five messages through from one address in ten minutes, then asks them to wait', async () => {
    const codes = []
    for (let i = 0; i < 6; i++) codes.push((await post(GOOD, '203.0.113.7')).status)
    expect(codes).toEqual([200, 200, 200, 200, 200, 429])
    expect(await (await post(GOOD, '203.0.113.7')).json()).toEqual({ error: contact.errors.rate })
    expect((await post(GOOD, '203.0.113.8')).status).toBe(200)
  })
})
