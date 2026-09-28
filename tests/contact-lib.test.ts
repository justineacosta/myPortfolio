import { afterEach, describe, expect, it, vi } from 'vitest'
import { contact } from '@/data/contact'
import { checkLead, mailtoHref, MAX_MESSAGE, submitLead } from '@/lib/contact'

const GOOD = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.' }
const form = (fields: Record<string, string>) => {
  const d = new FormData()
  for (const [k, v] of Object.entries(fields)) d.set(k, v)
  return d
}

describe('checkLead', () => {
  it('accepts a complete message', () => {
    const r = checkLead(form(GOOD))
    expect(r.errors).toBeNull()
    expect(r.lead).toMatchObject(GOOD)
  })

  it('names every missing field', () => {
    expect(checkLead(form({})).errors).toEqual({
      firstName: contact.errors.firstName,
      lastName: contact.errors.lastName,
      email: contact.errors.email,
      message: contact.errors.message,
    })
  })

  it('rejects an email that does not look like one', () => {
    expect(checkLead(form({ ...GOOD, email: 'ana@' })).errors).toEqual({ email: contact.errors.emailFormat })
  })

  it('strips control and zero-width characters, keeping newlines in the message', () => {
    const r = checkLead(form({ ...GOOD, firstName: 'A​na\u0007', message: 'line one\nline two\u0000' }))
    expect(r.lead?.firstName).toBe('Ana')
    expect(r.lead?.message).toBe('line one\nline two')
  })

  it('caps an overlong message', () => {
    expect(checkLead(form({ ...GOOD, message: 'x'.repeat(6000) })).lead?.message).toHaveLength(MAX_MESSAGE)
  })
})

describe('mailtoHref', () => {
  it('encodes every value, so a message cannot add mail headers or parameters', () => {
    const href = mailtoHref({ ...GOOD, website: '', firstName: 'Ana\r\nBcc: x@y.z', message: 'a&cc=b' }, 'me@kraft.dev')
    expect(href.startsWith('mailto:me%40kraft.dev?subject=')).toBe(true)
    expect(href).not.toMatch(/[\r\n]/)
    expect(href).not.toContain('&cc=')
  })
})

describe('submitLead', () => {
  afterEach(() => vi.unstubAllGlobals())
  const lead = { ...GOOD, website: '' }

  it('opens the mail client when no endpoint is set', async () => {
    const open = vi.fn()
    await expect(submitLead(lead, { endpoint: '', open })).resolves.toBe('mailto')
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/))
  })

  it('posts the lead as JSON to the endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    await expect(submitLead(lead, { endpoint: 'https://hooks.example/lead' })).resolves.toBe('webhook')
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.example/lead',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(lead) }),
    )
  })

  it("shows the server's own sentence when it refuses", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Try again in a minute.' }), { status: 429 })))
    await expect(submitLead(lead, { endpoint: 'https://x.example' })).rejects.toThrow('Try again in a minute.')
  })

  it('falls back to the status when the server gives no sentence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })))
    await expect(submitLead(lead, { endpoint: 'https://x.example' })).rejects.toThrow('The server answered 500.')
  })
})
