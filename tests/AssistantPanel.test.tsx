import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import AssistantRoot from '@/components/assistant/AssistantRoot'
import Assistant from '@/components/assistant/Assistant'
import { STORAGE_KEY, type Entry } from '@/components/assistant/AssistantProvider'
import { assistant } from '@/data/assistant'
import type { AssistantEvent } from '@/lib/assistant/events'

const nav = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => '/',
}))

const encoder = new TextEncoder()
const lines = (events: AssistantEvent[]) => events.map((e) => JSON.stringify(e) + '\n').join('')
/** A 200 response that streams the events and then closes. */
const stream = (events: AssistantEvent[]) =>
  new Response(new ReadableStream({ start: (c) => (c.enqueue(encoder.encode(lines(events))), c.close()) }), { status: 200 })
/** A 200 response that never ends. */
const pending = () => new Response(new ReadableStream({ start: () => {} }), { status: 200 })
const text = (delta: string): AssistantEvent => ({ type: 'text', delta })
const done: AssistantEvent = { type: 'done' }

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  nav.push.mockReset()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const setup = () =>
  render(
    <NavigationProvider>
      <AssistantRoot />
    </NavigationProvider>,
  )
const launcher = () => screen.getByRole('button', { name: assistant.launcher })
const dialog = () => screen.queryByRole('dialog', { name: assistant.title })
const input = () => screen.getByRole('textbox', { name: assistant.inputLabel })
const posted = (n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body as string)

/** Starts with a saved chat, which the provider restores after mount. */
function withChat(entries: Entry[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId: '11111111-1111-4111-8111-111111111111', entries }))
}
const user1: Entry = { id: 'u1', kind: 'user', text: 'Hi' }

describe('Assistant launcher and panel', () => {
  it('the launcher opens a dialog with the greeting, the three chips and a Privacy link', async () => {
    const user = userEvent.setup()
    setup()
    expect(dialog()).not.toBeInTheDocument()
    expect(launcher()).toHaveAttribute('aria-expanded', 'false')
    await user.click(launcher())
    const d = dialog()!
    expect(d).toBeInTheDocument()
    expect(d).toHaveAttribute('aria-modal', 'false')
    expect(d).toHaveAttribute('data-a11y-scale')
    expect(launcher()).toHaveAttribute('aria-expanded', 'true')
    expect(launcher()).toHaveAttribute('aria-controls', d.id)
    expect(screen.getByRole('heading', { name: assistant.title })).toBeInTheDocument()
    expect(within(d).getByText(assistant.badge)).toBeVisible()
    expect(within(d).getByText(assistant.greeting)).toBeVisible()
    for (const chip of assistant.chips) expect(within(d).getByRole('button', { name: chip })).toBeVisible()
    expect(within(d).getByRole('link', { name: assistant.privacy })).toHaveAttribute('href', '/privacy')
    expect(input()).toHaveFocus()
    expect(input()).toHaveAttribute('maxlength', '1000')
  })

  it('a chip posts its text', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([text('We build.'), done]))
    setup()
    await user.click(launcher())
    await user.click(screen.getByRole('button', { name: 'What do you build?' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(posted().messages).toEqual([{ role: 'user', content: 'What do you build?' }])
    // Once in the conversation, once in the screen-reader-only live region.
    expect(await screen.findAllByText('We build.')).toHaveLength(2)
    // The chips belong to the first view only.
    expect(screen.queryByRole('button', { name: 'What do you build?' })).not.toBeInTheDocument()
  })

  it('Enter twice while the reply is pending sends once and disables the input, the chips and Send', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(pending())
    setup()
    await user.click(launcher())
    await user.type(input(), 'Hello{Enter}{Enter}')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(input()).toBeDisabled())
    expect(screen.getByRole('button', { name: assistant.stop })).toBeEnabled()
    expect(screen.queryByRole('button', { name: assistant.send })).not.toBeInTheDocument()
  })

  it('Shift+Enter adds a new line and does not send', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(launcher())
    await user.type(input(), 'one{Shift>}{Enter}{/Shift}two')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(input()).toHaveValue('one\ntwo')
  })

  it('the Send button sends and clears the input', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([done]))
    setup()
    await user.click(launcher())
    await user.type(input(), 'Hello')
    await user.click(screen.getByRole('button', { name: assistant.send }))
    expect(posted().messages).toEqual([{ role: 'user', content: 'Hello' }])
    expect(input()).toHaveValue('')
  })

  it('Escape closes the dialog and focuses the launcher', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(launcher())
    expect(dialog()).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(dialog()).not.toBeInTheDocument()
    expect(launcher()).toHaveFocus()
  })

  it('the Close button closes the dialog and focuses the launcher', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(launcher())
    await user.click(screen.getByRole('button', { name: assistant.close }))
    expect(dialog()).not.toBeInTheDocument()
    expect(launcher()).toHaveFocus()
  })

  it('New chat clears the conversation', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'a1', kind: 'assistant', text: 'Hello there' }])
    setup()
    await user.click(launcher())
    expect(await screen.findByText('Hello there')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: assistant.newChat }))
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: assistant.chips[0] })).toBeInTheDocument()
  })

  it('a navigate entry reads “Taking you to Projects…” and the panel stays open', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([{ type: 'navigate', href: '/projects', label: 'Projects' }, done]))
    setup()
    await user.click(launcher())
    await user.click(screen.getByRole('button', { name: 'Show me your projects' }))
    expect(await screen.findByText('Taking you to Projects…')).toBeInTheDocument()
    expect(dialog()).toBeInTheDocument()
  })

  it('a lead entry shows the confirmation, or the failure with the Contact link', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'l1', kind: 'lead', ok: true }, { id: 'l2', kind: 'lead', ok: false }])
    setup()
    await user.click(launcher())
    expect(await screen.findByText(assistant.leadOk)).toBeInTheDocument()
    expect(screen.getByText(assistant.leadFailed)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: assistant.contact.label })[0]).toHaveAttribute('href', assistant.contact.href)
  })

  it('an error entry shows its text with the Contact link', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'e1', kind: 'error', text: assistant.errors.rate }])
    setup()
    await user.click(launcher())
    expect(await screen.findByText(assistant.errors.rate)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: assistant.contact.label })).toHaveAttribute('href', '/contact')
  })

  describe('links in a reply', () => {
    it('renders [text](/path) as a link that goes through the shell router', async () => {
      const user = userEvent.setup()
      fetchMock.mockResolvedValueOnce(stream([text('See [Services](/services) for more.'), done]))
      setup()
      await user.click(launcher())
      await user.type(input(), 'What do you offer?{Enter}')
      const link = await screen.findByRole('link', { name: 'Services' })
      expect(link).toHaveAttribute('href', '/services')
      await user.click(link)
      await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/services', { scroll: false }))
      expect(dialog()).toBeInTheDocument()
    })

    it('keeps any other bracket text as plain text', async () => {
      const user = userEvent.setup()
      const body = 'A [site](https://example.com), [odd](//evil.example), [back](/\\evil.example), [js](javascript:alert(1)) and [none].'
      withChat([user1, { id: 'a1', kind: 'assistant', text: body }])
      setup()
      await user.click(launcher())
      expect(await screen.findByText(body)).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /site|odd|back|js/ })).not.toBeInTheDocument()
    })

    it('keeps line breaks', async () => {
      const user = userEvent.setup()
      withChat([user1, { id: 'a1', kind: 'assistant', text: 'One\nTwo' }])
      setup()
      await user.click(launcher())
      expect((await screen.findByText(/One/)).className).toContain('whitespace-pre-wrap')
    })
  })

  describe('Retry', () => {
    const retry = () => screen.queryByRole('button', { name: assistant.retry })

    it('shows with an unfinished reply, and re-sends', async () => {
      const user = userEvent.setup()
      withChat([user1, { id: 'a1', kind: 'assistant', text: 'Half a', unfinished: true }])
      fetchMock.mockResolvedValueOnce(stream([text('A whole reply'), done]))
      setup()
      await user.click(launcher())
      expect(await screen.findByText(assistant.unfinished)).toBeInTheDocument()
      await user.click(retry()!)
      expect(await screen.findAllByText('A whole reply')).toHaveLength(2)
      expect(retry()).not.toBeInTheDocument()
    })

    it('shows after an error entry', async () => {
      const user = userEvent.setup()
      withChat([user1, { id: 'e1', kind: 'error', text: assistant.errors.failed }])
      setup()
      await user.click(launcher())
      await screen.findByText(assistant.errors.failed)
      expect(retry()).toBeInTheDocument()
    })

    it('shows when the conversation ends with the visitor’s own message (Stop before any text)', async () => {
      const user = userEvent.setup()
      withChat([user1])
      setup()
      await user.click(launcher())
      await screen.findByText('Hi')
      expect(retry()).toBeInTheDocument()
    })

    it('is hidden after a finished reply, and in a new chat', async () => {
      const user = userEvent.setup()
      withChat([user1, { id: 'a1', kind: 'assistant', text: 'Done.' }])
      setup()
      await user.click(launcher())
      await screen.findByText('Done.')
      expect(retry()).not.toBeInTheDocument()
    })

    it('is hidden while a reply is streaming', async () => {
      const user = userEvent.setup()
      withChat([user1])
      fetchMock.mockResolvedValueOnce(pending())
      setup()
      await user.click(launcher())
      await user.click(await screen.findByRole('button', { name: assistant.retry }))
      await waitFor(() => expect(input()).toBeDisabled())
      expect(retry()).not.toBeInTheDocument()
    })
  })

  it('announces a finished reply once, in a polite live region', async () => {
    const user = userEvent.setup()
    let finish!: () => void
    fetchMock.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(encoder.encode(lines([text('Hello')])))
            finish = () => (c.enqueue(encoder.encode(lines([text(' there'), done]))), c.close())
          },
        }),
      ),
    )
    setup()
    await user.click(launcher())
    await user.type(input(), 'Hi{Enter}')
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live).toHaveClass('sr-only')
    await screen.findByText('Hello')
    expect(live).toHaveTextContent('')
    finish()
    await waitFor(() => expect(live).toHaveTextContent('Hello there'))
  })

  it('refocuses the input when a reply ends', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([text('Hi!'), done]))
    setup()
    await user.click(launcher())
    await user.type(input(), 'Hello{Enter}')
    await waitFor(() => expect(input()).toBeEnabled())
    await waitFor(() => expect(input()).toHaveFocus())
  })
})

describe('Assistant (the server gate)', () => {
  it('renders nothing without a key or the fake', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.stubEnv('ASSISTANT_FAKE', '')
    expect(Assistant()).toBeNull()
  })

  it('renders the assistant with ASSISTANT_FAKE=1', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.stubEnv('ASSISTANT_FAKE', '1')
    expect(Assistant()).not.toBeNull()
  })

  it('renders the assistant with a key', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test')
    vi.stubEnv('ASSISTANT_FAKE', '')
    expect(Assistant()).not.toBeNull()
  })
})
