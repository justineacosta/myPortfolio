import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LeadForm from '@/components/chat/LeadForm'
import { chat } from '@/data/chat'
import { contact } from '@/data/contact'

const t = chat.lead

afterEach(() => vi.unstubAllGlobals())

describe('the contact card inside Lumen', () => {
  it('is a form named by its header, with each field named inside it and labelled for screen readers', () => {
    render(<LeadForm />)
    expect(screen.getByRole('form', { name: t.title })).toBeInTheDocument()
    for (const name of [t.firstName, t.lastName, t.email, t.message]) {
      expect(screen.getByLabelText(name)).toHaveAttribute('placeholder', name)
    }
    expect(screen.getByLabelText(t.message)).toHaveAttribute('rows', '2')
  })

  it('sends nothing until it is valid, and ties each error to its field', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<LeadForm />)
    await userEvent.type(screen.getByLabelText(t.email), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: t.send }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText(t.firstName)).toHaveAccessibleDescription(t.errors.firstName)
    expect(screen.getByLabelText(t.email)).toHaveAccessibleDescription(t.errors.emailFormat)
    expect(screen.getByLabelText(t.email)).toHaveAttribute('aria-invalid', 'true')
  })

  it("speaks in Lumen's voice, never Justine's", async () => {
    render(<LeadForm />)
    await userEvent.click(screen.getByRole('button', { name: t.send }))
    expect(screen.getByLabelText(t.email)).toHaveAccessibleDescription(t.errors.email)
    expect(screen.getByLabelText(t.message)).toHaveAccessibleDescription(t.errors.message)
    for (const said of Object.values(t.errors)) expect(said).not.toMatch(/\b(I|me|my)\b/)
  })

  it('keeps what was typed and shows the reason when the send is refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: contact.errors.rate }, { status: 429 })))
    render(<LeadForm />)
    await userEvent.type(screen.getByLabelText(t.firstName), 'Ada')
    await userEvent.type(screen.getByLabelText(t.lastName), 'Lovelace')
    await userEvent.type(screen.getByLabelText(t.email), 'ada@example.com')
    await userEvent.type(screen.getByLabelText(t.message), 'An intake automation.')
    await userEvent.click(screen.getByRole('button', { name: t.send }))
    expect(await screen.findByRole('alert')).toHaveTextContent(contact.errors.rate)
    expect(screen.getByLabelText(t.message)).toHaveValue('An intake automation.')
  })
})
