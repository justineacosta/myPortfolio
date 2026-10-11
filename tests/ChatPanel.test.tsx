import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatRoot from '@/components/chat/ChatRoot'
import { chat } from '@/data/chat'

const go = vi.fn()
const send = vi.fn()
const saveHandoff = vi.fn()
let state: { turns: { role: 'user' | 'assistant'; content: string }[]; streaming: string | null; contact: boolean; error: string | null; capped: boolean }

vi.mock('@/components/chat/useChat', () => ({ useChat: () => ({ ...state, send }) }))
vi.mock('@/components/shell/NavigationProvider', () => ({ useShellNav: () => ({ go }) }))
vi.mock('@/lib/chat/handoff', () => ({ saveHandoff: (t: unknown) => saveHandoff(t) }))

const PATHS = ['/services', '/contact', '/files/x.html']

function renderChat(enabled = true) {
  return render(<ChatRoot enabled={enabled} paths={PATHS} />)
}
const launcher = () => screen.getByRole('button', { name: chat.launcher })
async function open() {
  await userEvent.click(launcher())
  return screen.getByRole('dialog', { name: chat.title })
}

beforeEach(() => {
  go.mockReset()
  send.mockReset()
  saveHandoff.mockReset()
  state = { turns: [], streaming: null, contact: false, error: null, capped: false }
})

describe('chat launcher and panel', () => {
  it('renders nothing when chat is not enabled', () => {
    const { container } = renderChat(false)
    expect(container).toBeEmptyDOMElement()
  })

  it('opens a titled dialog from the launcher and puts focus in the input', async () => {
    renderChat()
    expect(launcher()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).toBeNull()
    const dialog = await open()
    expect(launcher()).toHaveAttribute('aria-expanded', 'true')
    expect(launcher()).toHaveAttribute('aria-controls', dialog.id)
    expect(screen.getByRole('textbox')).toHaveFocus()
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '500')
  })

  it('shows the greeting and suggestions on an empty chat, and a suggestion sends its text', async () => {
    renderChat()
    await open()
    expect(screen.getByText(chat.greeting)).toBeInTheDocument()
    for (const s of chat.suggestions) expect(screen.getByRole('button', { name: s })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: chat.suggestions[1] }))
    expect(send).toHaveBeenCalledWith(chat.suggestions[1])
  })

  it('hides the suggestions once the chat has turns', async () => {
    state.turns = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]
    renderChat()
    await open()
    expect(screen.queryByRole('button', { name: chat.suggestions[0] })).toBeNull()
  })

  it('sends what the visitor types, and clears the box', async () => {
    renderChat()
    await open()
    await userEvent.type(screen.getByRole('textbox'), '  What does it cost?{Enter}')
    expect(send).toHaveBeenCalledWith('What does it cost?')
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('renders a known path as a link that navigates through the shell', async () => {
    state.turns = [
      { role: 'user', content: 'what do you offer' },
      { role: 'assistant', content: 'See [Services](/services) for the list.' },
    ]
    renderChat()
    await open()
    const link = screen.getByRole('link', { name: 'Services' })
    expect(link).toHaveAttribute('href', '/services')
    await userEvent.click(link)
    expect(go).toHaveBeenCalledWith('/services')
  })

  it('leaves an unknown path as plain text', async () => {
    state.turns = [
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'Try [Evil](https://evil.example) or [Nope](/nope).' },
    ]
    renderChat()
    await open()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/Try Evil or Nope\./, { ignore: '[aria-live]' })).toBeInTheDocument()
  })

  it('makes a link to a file a plain anchor that does not go through the shell', async () => {
    state.turns = [
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'Open [the sample](/files/x.html).' },
    ]
    renderChat()
    await open()
    const link = screen.getByRole('link', { name: 'the sample' })
    // jsdom does not navigate on click; stop it so the test only checks the shell was not used.
    link.addEventListener('click', (e) => e.preventDefault())
    await userEvent.click(link)
    expect(go).not.toHaveBeenCalled()
  })

  it('shows the in-flight reply while streaming', async () => {
    state.turns = [{ role: 'user', content: 'q' }]
    state.streaming = 'Partial answ'
    renderChat()
    await open()
    expect(screen.getByText('Partial answ')).toBeInTheDocument()
  })

  it('announces a finished reply in a polite live region, and not the one in flight', async () => {
    state.turns = [{ role: 'user', content: 'q' }]
    state.streaming = 'Partial'
    const { rerender } = renderChat()
    await open()
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('')
    state.turns = [
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'Done, see [Services](/services).' },
    ]
    state.streaming = null
    rerender(<ChatRoot enabled paths={PATHS} />)
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Done, see Services.')
  })

  it('offers the hand-off after a reply asked for it, and the click saves, navigates and closes', async () => {
    state.turns = [
      { role: 'user', content: 'can we work together' },
      { role: 'assistant', content: 'Yes.' },
    ]
    state.contact = true
    renderChat()
    await open()
    await userEvent.click(screen.getByRole('button', { name: chat.handoff }))
    expect(saveHandoff).toHaveBeenCalledWith(state.turns)
    expect(go).toHaveBeenCalledWith('/contact')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('has no hand-off button when nothing asked for it', async () => {
    renderChat()
    await open()
    expect(screen.queryByRole('button', { name: chat.handoff })).toBeNull()
  })

  it('replaces the input with the capped line and the hand-off at the turn cap', async () => {
    state.capped = true
    renderChat()
    await open()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText(chat.capped)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: chat.handoff })).toBeInTheDocument()
  })

  it('shows an error sentence with the hand-off, and keeps the input', async () => {
    state.error = chat.errors.rate
    renderChat()
    await open()
    expect(screen.getByText(chat.errors.rate)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: chat.handoff })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows the privacy note in the footer', async () => {
    renderChat()
    await open()
    expect(screen.getByText(chat.privacy)).toBeInTheDocument()
  })

  it('closes with the close button and gives focus back to the launcher', async () => {
    renderChat()
    await open()
    await userEvent.click(screen.getByRole('button', { name: chat.close }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(launcher()).toHaveFocus()
  })

  it('closes on Esc and returns focus to the launcher', async () => {
    renderChat()
    await open()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(launcher()).toHaveFocus()
  })

  it('leaves the panel open when Esc was already handled', async () => {
    renderChat()
    await open()
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    esc.preventDefault()
    screen.getByRole('textbox').dispatchEvent(esc)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('leaves the panel open on Esc while another dialog has focus', async () => {
    renderChat()
    await open()
    const other = document.createElement('div')
    other.setAttribute('role', 'dialog')
    other.innerHTML = '<button>inside</button>'
    document.body.append(other)
    other.querySelector('button')!.focus()
    fireEvent.keyDown(other.querySelector('button')!, { key: 'Escape' })
    other.remove()
    expect(screen.getByRole('dialog', { name: chat.title })).toBeInTheDocument()
  })
})
