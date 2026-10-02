import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccessMenu from '@/components/shell/AccessMenu'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import AssistantRoot from '@/components/assistant/AssistantRoot'
import Assistant from '@/components/assistant/Assistant'
import { STORAGE_KEY, type Entry } from '@/components/assistant/AssistantProvider'
import { assistant } from '@/data/assistant'
import { contact } from '@/data/contact'
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

const setup = (mode: 'ai' | 'quick' = 'ai') =>
  render(
    <NavigationProvider>
      <AssistantRoot mode={mode} />
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

  it('moves focus to Stop when a reply starts streaming, and Escape on the page body still closes the panel', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(pending())
    setup()
    await user.click(launcher())
    await user.type(input(), 'Hello{Enter}')
    await waitFor(() => expect(input()).toBeDisabled())
    expect(screen.getByRole('button', { name: assistant.stop })).toHaveFocus()
    // Focus on <body>: a keydown there never reaches the dialog element.
    ;(document.activeElement as HTMLElement).blur()
    expect(document.body).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(dialog()).not.toBeInTheDocument()
    expect(launcher()).toHaveFocus()
  })

  describe('Escape defers to other overlays', () => {
    it('leaves the assistant open when an earlier handler already took the key', async () => {
      const user = userEvent.setup()
      setup()
      await user.click(launcher())
      // The ⌘K palette handles Esc in React and calls preventDefault: a capture listener on window stands in for it.
      const take = (e: KeyboardEvent) => e.preventDefault()
      window.addEventListener('keydown', take, true)
      await user.keyboard('{Escape}')
      window.removeEventListener('keydown', take, true)
      expect(dialog()).toBeInTheDocument()
    })

    it('leaves the assistant open when Esc comes from inside another dialog', async () => {
      const user = userEvent.setup()
      setup()
      await user.click(launcher())
      const other = document.createElement('div')
      other.setAttribute('role', 'dialog')
      other.innerHTML = '<button>Other</button>'
      document.body.append(other)
      other.querySelector('button')!.focus()
      await user.keyboard('{Escape}')
      other.remove()
      expect(dialog()).toBeInTheDocument()
    })

    it('leaves the assistant open while a sub-view (a native dialog) owns the screen', async () => {
      const user = userEvent.setup()
      setup()
      await user.click(launcher())
      document.documentElement.setAttribute('data-dialog', '')
      await user.keyboard('{Escape}')
      expect(dialog()).toBeInTheDocument()
    })

    it('with the real accessibility menu open, Esc closes only the menu, whether focus is in it or on its button', async () => {
      const user = userEvent.setup()
      render(
        <NavigationProvider>
          <AccessMenu />
          <AssistantRoot mode="ai" />
        </NavigationProvider>,
      )
      await user.click(launcher())
      const trigger = screen.getByRole('button', { name: 'Accessibility options' })
      await user.click(trigger)
      expect(screen.getByRole('dialog', { name: 'Accessibility' })).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog', { name: 'Accessibility' })).not.toBeInTheDocument()
      expect(dialog()).toBeInTheDocument()
      // With the menu open and focus back on its own button (not inside it).
      await user.click(trigger)
      trigger.focus()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog', { name: 'Accessibility' })).not.toBeInTheDocument()
      expect(dialog()).toBeInTheDocument()
      // Nothing else is open now, so the next Esc closes the assistant.
      await user.keyboard('{Escape}')
      expect(dialog()).not.toBeInTheDocument()
    })
  })

  it('Escape also works while focus is on a chip click target or Stop', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(pending())
    setup()
    await user.click(launcher())
    await user.click(screen.getByRole('button', { name: assistant.chips[0] }))
    expect(await screen.findByRole('button', { name: assistant.stop })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(dialog()).not.toBeInTheDocument()
  })

  describe('announcing a turn that ends without a finished reply', () => {
    const live = () => document.querySelector('[aria-live="polite"]')!

    it('announces the error text when the server refuses with 429', async () => {
      const user = userEvent.setup()
      fetchMock.mockResolvedValueOnce(Response.json({ error: assistant.errors.rate }, { status: 429 }))
      setup()
      await user.click(launcher())
      await user.type(input(), 'Hi{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent(assistant.errors.rate))
    })

    it('announces a failed lead, and a lead that went through', async () => {
      const user = userEvent.setup()
      fetchMock.mockResolvedValueOnce(stream([{ type: 'lead', ok: false }, done])).mockResolvedValueOnce(stream([{ type: 'lead', ok: true }, done]))
      setup()
      await user.click(launcher())
      await user.type(input(), 'Hi{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent(assistant.leadFailed))
      await user.type(input(), 'Again{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent(assistant.leadOk))
    })

    it('announces that a reply was cut off', async () => {
      const user = userEvent.setup()
      fetchMock.mockResolvedValueOnce(stream([text('Half a')]))
      setup()
      await user.click(launcher())
      await user.type(input(), 'Hi{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent(assistant.unfinished))
    })

    it('announces the same failure again on a second turn', async () => {
      const user = userEvent.setup()
      let second!: (r: Response) => void
      fetchMock.mockResolvedValueOnce(Response.json({ error: assistant.errors.rate }, { status: 429 })).mockReturnValueOnce(new Promise<Response>((r) => (second = r)))
      setup()
      await user.click(launcher())
      await user.type(input(), 'Hi{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent(assistant.errors.rate))
      await user.click(screen.getByRole('button', { name: assistant.retry }))
      await waitFor(() => expect(live()).toBeEmptyDOMElement())
      second(Response.json({ error: assistant.errors.rate }, { status: 429 }))
      await waitFor(() => expect(live()).toHaveTextContent(assistant.errors.rate))
    })

    it('still announces a finished reply, not the lead that came before it', async () => {
      const user = userEvent.setup()
      fetchMock.mockResolvedValueOnce(stream([{ type: 'lead', ok: true }, text('Thanks, it’s sent.'), done]))
      setup()
      await user.click(launcher())
      await user.type(input(), 'Hi{Enter}')
      await waitFor(() => expect(live()).toHaveTextContent('Thanks, it’s sent.'))
      expect(live()).not.toHaveTextContent(assistant.leadOk)
    })
  })

  it('announces a reply’s links as their labels, not as Markdown', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([text('See [Services](/services) for more, or [a site](https://example.com).'), done]))
    setup()
    await user.click(launcher())
    await user.type(input(), 'What do you offer?{Enter}')
    const live = document.querySelector('[aria-live="polite"]')!
    await waitFor(() => expect(live).toHaveTextContent('See Services for more, or [a site](https://example.com).'))
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
  it('with no key and no fake renders the root in quick mode: the launcher is there and the panel shows the quick badge', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    vi.stubEnv('ASSISTANT_FAKE', '')
    const user = userEvent.setup()
    render(<NavigationProvider>{Assistant()}</NavigationProvider>)
    await user.click(launcher())
    expect(within(dialog()!).getByText(assistant.badgeQuick)).toBeVisible()
  })
})

describe('the panel’s mode', () => {
  it('quick mode shows the Quick answers badge, the quick greeting and the note, and not the AI badge or greeting', async () => {
    const user = userEvent.setup()
    setup('quick')
    await user.click(launcher())
    const d = dialog()!
    expect(within(d).getByText(assistant.badgeQuick)).toBeVisible()
    expect(within(d).getByText(assistant.greetingQuick)).toBeVisible()
    expect(within(d).getByText(assistant.quick.note)).toBeVisible()
    expect(within(d).queryByText(assistant.badge)).not.toBeInTheDocument()
    expect(within(d).queryByText(assistant.greeting)).not.toBeInTheDocument()
  })

  it('ai mode shows the AI badge and greeting, and no note in the first view', async () => {
    const user = userEvent.setup()
    setup('ai')
    await user.click(launcher())
    const d = dialog()!
    expect(within(d).getByText(assistant.badge)).toBeVisible()
    expect(within(d).getByText(assistant.greeting)).toBeVisible()
    expect(within(d).queryByText(assistant.badgeQuick)).not.toBeInTheDocument()
    expect(within(d).queryByText(assistant.quick.note)).not.toBeInTheDocument()
  })

  it('an assistant entry answered by the site engine shows the note under its bubble in ai mode, and a Claude one does not', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'a1', kind: 'assistant', text: 'From the site.', quick: true }, { id: 'a2', kind: 'assistant', text: 'From Claude.' }])
    setup('ai')
    await user.click(launcher())
    await screen.findByText('From the site.')
    expect(screen.getAllByText(assistant.quick.note)).toHaveLength(1)
  })

  it('a quick-mode reply does not repeat the note under each bubble', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'a1', kind: 'assistant', text: 'From the site.', quick: true }])
    setup('quick')
    await user.click(launcher())
    await screen.findByText('From the site.')
    expect(screen.getAllByText(assistant.quick.note)).toHaveLength(1)
  })
})

describe('the lead form card', () => {
  const f = assistant.quick.form
  const live = () => document.querySelector('[aria-live="polite"]')!
  const card = () => screen.getByRole('group', { name: f.title })
  const sendButton = () => within(card()).getByRole('button', { name: new RegExp(`^(${f.send}|${f.sending})$`) })
  /** The visible copy of a notice: the same text is also in the screen-reader-only live region. */
  const shown = async (t: string) => {
    const all = await screen.findAllByText(t)
    const seen = all.filter((el) => !el.closest('[aria-live]'))
    expect(seen).toHaveLength(1)
    return seen[0]
  }
  const leadCalls = () => fetchMock.mock.calls.filter((c) => c[0] === '/api/chat/lead')
  const openCard = async (mode: 'ai' | 'quick' = 'quick') => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(stream([text('Want Justine to reply?'), { type: 'form' }, done]))
    setup(mode)
    await user.click(launcher())
    await user.type(input(), 'I want to hire Justine{Enter}')
    await screen.findByRole('group', { name: f.title })
    return user
  }
  const fill = async (user: ReturnType<typeof userEvent.setup>, email = 'ada@example.com') => {
    await user.type(within(card()).getByLabelText(f.firstName), 'Ada')
    await user.type(within(card()).getByLabelText(f.lastName), 'Lovelace')
    await user.type(within(card()).getByLabelText(f.email), email)
    await user.type(within(card()).getByLabelText(f.message), 'A project')
  }

  it('a form event renders a group with labelled fields, a call checkbox and Send', async () => {
    await openCard()
    const c = within(card())
    expect(c.getByLabelText(f.firstName)).toHaveAttribute('autocomplete', 'given-name')
    expect(c.getByLabelText(f.lastName)).toHaveAttribute('autocomplete', 'family-name')
    expect(c.getByLabelText(f.email)).toHaveAttribute('type', 'email')
    expect(c.getByLabelText(f.email)).toHaveAttribute('autocomplete', 'email')
    expect(c.getByLabelText(f.message).tagName).toBe('TEXTAREA')
    expect(c.getByRole('checkbox', { name: f.call })).not.toBeChecked()
    expect(sendButton()).toBeEnabled()
  })

  it('shows a 400’s field error under Email, marks it invalid, ties it with aria-describedby and focuses it', async () => {
    const user = await openCard()
    fetchMock.mockResolvedValueOnce(Response.json({ errors: { email: contact.errors.emailFormat } }, { status: 400 }))
    await fill(user, 'nope')
    await user.click(sendButton())
    const email = within(card()).getByLabelText(f.email)
    const error = await within(card()).findByText(contact.errors.emailFormat)
    await waitFor(() => expect(email).toHaveFocus())
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email.getAttribute('aria-describedby')).toBe(error.id)
    expect(within(card()).getByLabelText(f.firstName)).not.toHaveAttribute('aria-invalid')
    // The card stays open for another go, and the error is not read out in the live region.
    expect(sendButton()).toBeEnabled()
    expect(live()).not.toHaveTextContent(contact.errors.emailFormat)
  })

  it('two quick clicks on Send post once, and the button reads Sending and is disabled while pending', async () => {
    const user = await openCard()
    let reply!: (r: Response) => void
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (reply = r)))
    await fill(user)
    await user.dblClick(sendButton())
    expect(leadCalls()).toHaveLength(1)
    expect(sendButton()).toHaveTextContent(f.sending)
    expect(sendButton()).toBeDisabled()
    expect(JSON.parse(leadCalls()[0][1].body as string)).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', message: 'A project', call: false })
    reply(Response.json({ ok: true }))
    await shown(assistant.leadOk)
  })

  it('a 200 shows the sent notice and announces it in the live region', async () => {
    const user = await openCard()
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }))
    await fill(user)
    await user.click(within(card()).getByRole('checkbox', { name: f.call }))
    await user.click(sendButton())
    await shown(assistant.leadOk)
    expect(screen.queryByRole('group', { name: f.title })).not.toBeInTheDocument()
    await waitFor(() => expect(live()).toHaveTextContent(assistant.leadOk))
    expect(JSON.parse(leadCalls()[0][1].body as string).call).toBe(true)
    // Focus goes back to the chat input, not to <body>.
    await waitFor(() => expect(input()).toHaveFocus())
  })

  it('a failure shows the failed notice with the Contact link and announces it', async () => {
    const user = await openCard()
    fetchMock.mockResolvedValueOnce(Response.json({ error: assistant.leadFailed }, { status: 502 }))
    await fill(user)
    await user.click(sendButton())
    await shown(assistant.leadFailed)
    expect(screen.getByRole('link', { name: assistant.contact.label })).toHaveAttribute('href', '/contact')
    await waitFor(() => expect(live()).toHaveTextContent(assistant.leadFailed))
  })

  it('shows and announces the server’s own line when it gives one (the limit, or already sent)', async () => {
    const user = await openCard()
    fetchMock.mockResolvedValueOnce(Response.json({ error: f.already }, { status: 409 }))
    await fill(user)
    await user.click(sendButton())
    await shown(f.already)
    await waitFor(() => expect(live()).toHaveTextContent(f.already))
  })

  it('Send is disabled while a chat reply is streaming', async () => {
    const user = await openCard()
    fetchMock.mockResolvedValueOnce(pending())
    await user.type(input(), 'More{Enter}')
    await waitFor(() => expect(input()).toBeDisabled())
    expect(sendButton()).toBeDisabled()
  })

  it('a saved open card shows again after a reload with empty fields, and sends', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'a1', kind: 'assistant', text: 'Want Justine to reply?' }, { id: 'f1', kind: 'form', state: 'open' }])
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }))
    setup('quick')
    await user.click(launcher())
    await screen.findByRole('group', { name: f.title })
    for (const label of [f.firstName, f.lastName, f.email, f.message]) expect(within(card()).getByLabelText(label)).toHaveValue('')
    await fill(user)
    await user.click(sendButton())
    await shown(assistant.leadOk)
    expect(JSON.parse(leadCalls()[0][1].body as string).messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Want Justine to reply?' },
    ])
  })

  it('a saved sent or failed card shows its notice and is not announced again', async () => {
    const user = userEvent.setup()
    withChat([user1, { id: 'f1', kind: 'form', state: 'sent' }, { id: 'f2', kind: 'form', state: 'failed' }])
    setup('quick')
    await user.click(launcher())
    expect(await screen.findByText(assistant.leadOk)).toBeInTheDocument()
    expect(screen.getByText(assistant.leadFailed)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: f.title })).not.toBeInTheDocument()
    expect(live()).toBeEmptyDOMElement()
  })
})
