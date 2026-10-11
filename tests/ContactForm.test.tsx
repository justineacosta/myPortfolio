import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import ContactForm from '@/components/contact/ContactForm'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import { HANDOFF_EVENT, saveHandoff } from '@/lib/chat/handoff'
import { HANDOFF_KEY } from '@/lib/storage-keys'

const GOOD = { first: 'Ana', last: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.' }
const f = contact.fields
const submit = () => screen.getByRole('button', { name: new RegExp(contact.submit) })

async function fill(user: UserEvent) {
  await user.type(screen.getByLabelText(f.firstName.label), GOOD.first)
  await user.type(screen.getByLabelText(f.lastName.label), GOOD.last)
  await user.type(screen.getByLabelText(f.email.label), GOOD.email)
  await user.type(screen.getByLabelText(f.message.label), GOOD.message)
}

describe('ContactForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('names each missing field and focuses the first one', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.click(submit())
    const first = screen.getByLabelText(f.firstName.label)
    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(first).toHaveAccessibleDescription(contact.errors.firstName)
    expect(first).toHaveFocus()
    expect(screen.getByLabelText(f.email.label)).toHaveAccessibleDescription(contact.errors.email)
  })

  it('the first bad field already names its error when it takes focus', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    const first = screen.getByLabelText(f.firstName.label)
    let described: string | null = 'never focused'
    first.addEventListener('focus', () => {
      described = first.getAttribute('aria-describedby')
    })
    await user.click(submit())
    expect(described).toBe('contact-firstName-error')
  })

  it('clears an error as soon as the field is fixed', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.click(submit())
    await user.type(screen.getByLabelText(f.firstName.label), 'Ana')
    expect(screen.getByLabelText(f.firstName.label)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(f.lastName.label)).toHaveAttribute('aria-invalid', 'true')
  })

  it('sends the message to the contact route and says it arrived', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }))
    vi.stubGlobal('fetch', fetch)
    const user = userEvent.setup()
    render(<ContactForm />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('heading', { name: contact.sent.title })).toHaveFocus()
    expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ firstName: GOOD.first, email: GOOD.email, message: GOOD.message })
    expect(screen.getByText(contact.sent.body)).toBeInTheDocument()
  })

  it('keeps what was typed when the endpoint refuses, and shows why', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Inbox is full.' }), { status: 503 })))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Inbox is full.')
    expect(screen.getByLabelText(f.firstName.label)).toHaveValue(GOOD.first)
    expect(screen.getByLabelText(f.message.label)).toHaveValue(GOOD.message)
  })

  it('Send another brings back an empty form, ready to type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true })))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fill(user)
    await user.click(submit())
    await user.click(await screen.findByRole('button', { name: contact.sent.again }))
    const first = screen.getByLabelText(f.firstName.label)
    expect(first).toHaveValue('')
    expect(first).toHaveFocus()
  })

  it('offers the address to write to when sending fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Inbox is full.' }), { status: 503 })))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fill(user)
    await user.click(submit())
    await screen.findByRole('alert')
    expect(screen.getByText(contact.errors.direct, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
  })

  it('starts the message with what the visitor asked the chat, once', () => {
    sessionStorage.setItem(HANDOFF_KEY, 'Do you build intake automations?')
    render(<ContactForm />)
    expect(screen.getByLabelText(f.message.label)).toHaveValue('Do you build intake automations?')
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull()
  })

  it('fills a form that is already open when the chat hands over, and clears the key', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(f.message.label)).toHaveValue('')
    saveHandoff([{ role: 'user', content: 'Can you start in March?' }])
    act(() => {
      window.dispatchEvent(new Event(HANDOFF_EVENT))
    })
    expect(screen.getByLabelText(f.message.label)).toHaveValue('Can you start in March?')
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull()
  })

  it('stops listening for the hand-off once unmounted', () => {
    const { unmount } = render(<ContactForm />)
    unmount()
    saveHandoff([{ role: 'user', content: 'Later' }])
    window.dispatchEvent(new Event(HANDOFF_EVENT))
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBe('Later')
  })

  it('leaves the message empty when nothing was handed over', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(f.message.label)).toHaveValue('')
  })
})
