// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assistant } from '@/data/assistant'
import { contact } from '@/data/contact'
import { resendMailer } from '@/lib/assistant/mail'

const ENV = { RESEND_API_KEY: 're_test', CONTACT_FROM: 'Kraft <onboarding@resend.dev>', CONTACT_TO: 'me@kraft.dev' }
const LEAD = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.', website: '' }
const TRANSCRIPT = 'Visitor: I have a project in mind\nAssistant: Happy to pass it on.'

const sent = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.map(([url, init]) => ({ url, auth: init.headers.Authorization, ...JSON.parse(init.body) }))

describe('resendMailer', () => {
  let fetch: ReturnType<typeof vi.fn>
  let error: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    fetch = vi.fn().mockResolvedValue(Response.json({ id: 'x' }))
    vi.stubGlobal('fetch', fetch)
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('posts the notification to CONTACT_TO, replying to the visitor, with the transcript, then the confirmation to the visitor, replying to CONTACT_TO', async () => {
    await resendMailer(ENV)(LEAD, { call: false, transcript: TRANSCRIPT })
    expect(fetch).toHaveBeenCalledTimes(2)
    const [mine, theirs] = sent(fetch)
    expect(mine).toMatchObject({
      url: 'https://api.resend.com/emails',
      auth: 'Bearer re_test',
      from: ENV.CONTACT_FROM,
      to: ['me@kraft.dev'],
      reply_to: 'ana@example.com',
      subject: 'Project inquiry from Ana Reyes',
    })
    expect(mine.text).toContain('Our intake is manual.')
    expect(mine.text).toContain(TRANSCRIPT)
    expect(mine.text).toContain(`${assistant.email.transcript}:`)
    expect(mine.html).toContain('Visitor: I have a project in mind')
    expect(mine.html).toContain(assistant.email.footer)
    expect(mine.html).not.toContain(contact.notify.footer)
    expect(theirs).toMatchObject({ url: 'https://api.resend.com/emails', auth: 'Bearer re_test', from: ENV.CONTACT_FROM, to: ['ana@example.com'], reply_to: 'me@kraft.dev', subject: contact.reply.subject })
    expect(theirs.text).toContain('Hi Ana,')
    expect(theirs.text).not.toContain('Our intake is manual.')
  })

  it('tags a call request in the notification’s subject', async () => {
    await resendMailer(ENV)(LEAD, { call: true, transcript: TRANSCRIPT })
    expect(sent(fetch)[0].subject).toBe('Call request from Ana Reyes')
  })

  it('rejects when the notification fails, and sends no confirmation', async () => {
    fetch.mockResolvedValue(Response.json({ message: 'nope' }, { status: 500 }))
    await expect(resendMailer(ENV)(LEAD, { call: false, transcript: TRANSCRIPT })).rejects.toThrow('Resend answered 500')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('resolves, and logs the failure, when only the confirmation fails', async () => {
    fetch.mockResolvedValueOnce(Response.json({ id: 'x' })).mockResolvedValueOnce(Response.json({ message: 'domain not verified' }, { status: 403 }))
    await expect(resendMailer(ENV)(LEAD, { call: false, transcript: TRANSCRIPT })).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledWith('Assistant: the confirmation was not sent.', expect.any(Error))
  })

  it('rejects before any request when the key or an address is missing', async () => {
    for (const missing of Object.keys(ENV)) {
      await expect(resendMailer({ ...ENV, [missing]: undefined })(LEAD, { call: false, transcript: TRANSCRIPT })).rejects.toThrow('must all be set')
      await expect(resendMailer({ ...ENV, [missing]: '' })(LEAD, { call: false, transcript: TRANSCRIPT })).rejects.toThrow('must all be set')
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})
