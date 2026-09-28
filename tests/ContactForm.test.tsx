import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import ContactForm from '@/components/contact/ContactForm'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'

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
  afterEach(() => vi.unstubAllGlobals())

  it('names each missing field and focuses the first one', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await user.click(submit())
    const first = screen.getByLabelText(f.firstName.label)
    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(first).toHaveAccessibleDescription(contact.errors.firstName)
    expect(first).toHaveFocus()
    expect(screen.getByLabelText(f.email.label)).toHaveAccessibleDescription(contact.errors.email)
  })

  it('the first bad field already names its error when it takes focus', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    const first = screen.getByLabelText(f.firstName.label)
    let described: string | null = 'never focused'
    first.addEventListener('focus', () => {
      described = first.getAttribute('aria-describedby')
    })
    await user.click(submit())
    expect(described).toBe('contact-firstName-error')
  })

  it('keeps the message after a mail-app send, ready to copy if no app opened', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await fill(user)
    await user.click(submit())
    await user.click(await screen.findByRole('button', { name: contact.sent.copyMessage }))
    expect(await navigator.clipboard.readText()).toContain(GOOD.message)
    expect(screen.getByRole('button', { name: contact.sent.copiedMessage })).toBeInTheDocument()
  })

  it('clears an error as soon as the field is fixed', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await user.click(submit())
    await user.type(screen.getByLabelText(f.firstName.label), 'Ana')
    expect(screen.getByLabelText(f.firstName.label)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(f.lastName.label)).toHaveAttribute('aria-invalid', 'true')
  })

  it('queues the message in the mail app and offers the address as a fallback', async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    render(<ContactForm open={open} />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('heading', { name: contact.sent.title })).toHaveFocus()
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/))
    expect(screen.getByText(contact.sent.mailto)).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: contact.sent.copy })).toBeInTheDocument()
  })

  it('keeps what was typed when the endpoint refuses, and shows why', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Inbox is full.' }), { status: 503 })))
    const user = userEvent.setup()
    render(<ContactForm endpoint="https://hooks.example/lead" />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Inbox is full.')
    expect(screen.getByLabelText(f.firstName.label)).toHaveValue(GOOD.first)
    expect(screen.getByLabelText(f.message.label)).toHaveValue(GOOD.message)
  })

  it('Send another brings back an empty form, ready to type', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
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
    render(<ContactForm endpoint="https://hooks.example/lead" />)
    await fill(user)
    await user.click(submit())
    await screen.findByRole('alert')
    expect(screen.getByText(contact.errors.direct, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
  })
})
