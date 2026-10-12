import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatRoot from '@/components/chat/ChatRoot'
import { chat } from '@/data/chat'
import { STARTER_SUGGESTIONS } from '@/lib/chat/suggestions'
import { CHAT_KEY, CHAT_WIDE_KEY } from '@/lib/storage-keys'
import { CHAT_TTL_MS } from '@/components/chat/useChat'
import type { CardProject } from '@/lib/chat/samples'

const go = vi.fn()
vi.mock('@/components/shell/NavigationProvider', () => ({ useShellNav: () => ({ go }) }))
const nav = vi.hoisted(() => ({ path: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.path }))

const PATHS = ['/services', '/contact', '/projects', '/cases/ostler-barbers/ai-agents.html']
const PROJECTS: CardProject[] = [{ key: 'ostler-barbers', name: 'Ostler', trade: 'barbershop', thumb: '/samples/thumbs/ostler-barbers.jpeg', href: '/cases/ostler-barbers/ai-agents.html' }]

/** A /api/chat answer: the reply as one chunk, marked with who wrote it. */
const answer = (text: string, mode: 'live' | 'local' = 'live') =>
  new Response(text, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-assistant-mode': mode } })

let fetchMock: ReturnType<typeof vi.fn>

function renderChat(ai = true) {
  return render(<ChatRoot ai={ai} paths={PATHS} projects={PROJECTS} />)
}
const launcher = () => screen.getByRole('button', { name: chat.launcher })
async function open() {
  await userEvent.click(launcher())
  return screen.getByRole('dialog', { name: chat.name })
}
/** Text in a bubble, not its screen-reader copy. */
const SEEN = { ignore: '.sr-only, script, style' }
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body as string)

beforeEach(() => {
  go.mockReset()
  nav.path = '/'
  fetchMock = vi.fn().mockResolvedValue(answer('Hello there.'))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('Lumen', () => {
  it('opens a dialog named Lumen with the greeting, the four starter chips and focus in the box', async () => {
    renderChat()
    expect(launcher()).toHaveAttribute('aria-expanded', 'false')
    const dialog = await open()
    expect(launcher()).toHaveAttribute('aria-controls', dialog.id)
    expect(within(dialog).getByText('Lumen', { selector: 'strong' })).toBeInTheDocument()
    for (const s of STARTER_SUGGESTIONS) expect(within(dialog).getByRole('button', { name: s })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: chat.message })).toHaveFocus()
  })

  it('opens with / from anywhere except while typing', () => {
    renderChat()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(screen.getByRole('dialog', { name: chat.name })).toBeInTheDocument()
  })

  it('leaves / alone in a text field', () => {
    render(
      <>
        <input aria-label="search" />
        <ChatRoot ai paths={PATHS} projects={PROJECTS} />
      </>,
    )
    fireEvent.keyDown(screen.getByLabelText('search'), { key: '/' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sends a chip, shows the reply with its link, and marks it Claude', async () => {
    fetchMock.mockResolvedValue(answer('He builds apps. See [the services](/services).'))
    renderChat()
    const dialog = await open()
    await userEvent.click(within(dialog).getByRole('button', { name: STARTER_SUGGESTIONS[0] }))
    const link = await within(dialog).findByRole('link', { name: 'the services' })
    expect(sentBody()).toEqual({ messages: [{ role: 'user', content: STARTER_SUGGESTIONS[0] }], page: '/' })
    expect(within(dialog).getByText(chat.badge.label)).toBeInTheDocument()
    await userEvent.click(link)
    expect(go).toHaveBeenCalledWith('/services')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows a link to a page the site does not have as plain text', async () => {
    fetchMock.mockResolvedValue(answer('Read [the blog](/blog).'))
    renderChat()
    const dialog = await open()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'Blog?{Enter}')
    await within(dialog).findByText('the blog', { ...SEEN, exact: false })
    expect(within(dialog).queryByRole('link', { name: 'the blog' })).toBeNull()
  })

  it('draws the project card a reply asks for, and nothing for an unknown slug', async () => {
    fetchMock.mockResolvedValueOnce(answer('Ostler is a sample.\n[[project:ostler-barbers]]')).mockResolvedValueOnce(answer('Another.\n[[project:made-up]]'))
    renderChat()
    const dialog = await open()
    const box = screen.getByRole('textbox', { name: chat.message })
    await userEvent.type(box, 'Ostler?{Enter}')
    const card = await within(dialog).findByRole('link', { name: /Ostler/ })
    expect(card).toHaveAttribute('href', PROJECTS[0].href)
    expect(within(dialog).getByText(chat.card.badge)).toBeInTheDocument()
    await userEvent.type(box, 'More?{Enter}')
    await within(dialog).findByText('Another.', SEEN)
    expect(within(dialog).getAllByText(chat.card.badge)).toHaveLength(1)
    expect(within(dialog).queryByText(/\[\[/, SEEN)).toBeNull()
  })

  it('draws the contact form once per chat, and sends it to the contact route', async () => {
    fetchMock.mockResolvedValueOnce(answer('Happy to.\n[[lead-form]]')).mockResolvedValueOnce(answer('Still here.\n[[lead-form]]'))
    renderChat()
    const dialog = await open()
    const box = screen.getByRole('textbox', { name: chat.message })
    await userEvent.type(box, 'Can I hire him?{Enter}')
    await within(dialog).findByText(chat.lead.title)
    await userEvent.type(box, 'And now?{Enter}')
    await within(dialog).findByText('Still here.', SEEN)
    expect(within(dialog).getAllByText(chat.lead.title)).toHaveLength(1)

    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }))
    await userEvent.type(within(dialog).getByLabelText(chat.lead.firstName), 'Ada')
    await userEvent.type(within(dialog).getByLabelText(chat.lead.lastName), 'Lovelace')
    await userEvent.type(within(dialog).getByLabelText(chat.lead.email), 'ada@example.com')
    // The message starts with what was asked before the form appeared, and nothing after.
    const message = within(dialog).getByLabelText(chat.lead.message)
    expect(message).toHaveValue(`${chat.lead.draftIntro}\n- Can I hire him?\n\n`)
    expect(within(dialog).getByText(chat.lead.noteDraft)).toBeInTheDocument()
    await userEvent.type(message, 'An intake automation.')
    await userEvent.click(within(dialog).getByRole('button', { name: chat.lead.send }))
    await within(dialog).findByText(chat.lead.sent)
    const [url, init] = fetchMock.mock.calls.at(-1)!
    expect(url).toBe('/api/contact')
    expect(JSON.parse(init.body)).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', website: '' })
    expect(JSON.parse(init.body).message).toContain('- Can I hire him?')
    expect(JSON.parse(init.body).message).toContain('An intake automation.')
  })

  it('says Claude even with no key and an offline answer, and that the site keeps nothing', async () => {
    fetchMock.mockResolvedValue(answer('Offline answer.', 'local'))
    renderChat(false)
    const dialog = await open()
    expect(within(dialog).getByText(chat.badge.label)).toBeInTheDocument()
    expect(within(dialog).getByText(chat.privacy.site)).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'Hi{Enter}')
    await within(dialog).findByText('Offline answer.', SEEN)
    // The badge says Claude whoever answered; only the privacy line follows the offline answer.
    expect(within(dialog).getByText(chat.badge.label)).toBeInTheDocument()
    expect(within(dialog).getByText(chat.privacy.site)).toBeInTheDocument()
  })

  it('writes a refused request into the reply, so the next question still sends a valid history', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: chat.errors.rate }, { status: 429 })).mockResolvedValueOnce(answer('Back now.'))
    renderChat()
    const dialog = await open()
    const box = screen.getByRole('textbox', { name: chat.message })
    await userEvent.type(box, 'One{Enter}')
    await within(dialog).findByText('Too many messages', { ...SEEN, exact: false })
    await userEvent.type(box, 'Two{Enter}')
    await within(dialog).findByText('Back now.', SEEN)
    expect(sentBody(1).messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user'])
  })

  it('stops a reply that is still arriving', async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_, reject) => init.signal!.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))))
    renderChat()
    const dialog = await open()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'Long one{Enter}')
    await userEvent.click(await within(dialog).findByRole('button', { name: chat.stop }))
    await within(dialog).findByText('Stopped.', SEEN)
    expect(within(dialog).getByRole('button', { name: chat.send })).toBeInTheDocument()
  })

  it('keeps the chat in the browser, restores it, and resets it', async () => {
    const first = renderChat()
    let dialog = await open()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'Remember me{Enter}')
    await within(dialog).findByText('Hello there.', SEEN)
    await waitFor(() => expect(localStorage.getItem(CHAT_KEY)).toContain('Remember me'))
    first.unmount()

    renderChat()
    dialog = await open()
    expect(await within(dialog).findByText('Remember me')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: chat.reset }))
    expect(within(dialog).queryByText('Remember me')).toBeNull()
    expect(localStorage.getItem(CHAT_KEY)).toBeNull()
  })

  it('forgets a chat older than three days', async () => {
    const at = Date.now() - CHAT_TTL_MS - 1000
    localStorage.setItem(CHAT_KEY, JSON.stringify({ messages: [{ id: 'a', role: 'user', content: 'Old question' }, { id: 'b', role: 'assistant', content: 'Old answer' }], mode: 'live', at }))
    renderChat()
    const dialog = await open()
    for (const s of STARTER_SUGGESTIONS) expect(within(dialog).getByRole('button', { name: s })).toBeInTheDocument()
    expect(within(dialog).queryByText('Old question')).toBeNull()
    expect(localStorage.getItem(CHAT_KEY)).toBeNull()
  })

  it('restores a reply saved mid-answer as interrupted', async () => {
    localStorage.setItem(CHAT_KEY, JSON.stringify({ messages: [{ id: 'a', role: 'user', content: 'Q' }, { id: 'b', role: 'assistant', content: 'Par', pending: true }], mode: 'live', at: Date.now() }))
    renderChat()
    const dialog = await open()
    expect(await within(dialog).findByText('Interrupted. Ask again to continue.', SEEN)).toBeInTheDocument()
    // An interrupted reply can be asked again, in its place.
    fetchMock.mockResolvedValueOnce(answer('The full answer.'))
    await userEvent.click(within(dialog).getByRole('button', { name: chat.actions.retry }))
    await within(dialog).findByText('The full answer.', SEEN)
    expect(sentBody().messages).toEqual([{ role: 'user', content: 'Q' }])
    expect(within(dialog).queryByText('Interrupted. Ask again to continue.', SEEN)).toBeNull()
    expect(within(dialog).queryByRole('button', { name: chat.actions.retry })).toBeNull()
  })

  it('offers Try again on a failed reply only, and asks the same question again', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(answer('Second try worked.'))
    renderChat()
    const dialog = await open()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'Flaky?{Enter}')
    await within(dialog).findByText('Something went wrong', { ...SEEN, exact: false })
    await userEvent.click(within(dialog).getByRole('button', { name: chat.actions.retry }))
    await within(dialog).findByText('Second try worked.', SEEN)
    expect(sentBody(1).messages).toEqual([{ role: 'user', content: 'Flaky?' }])
    expect(within(dialog).queryByRole('button', { name: chat.actions.retry })).toBeNull()
    expect(within(dialog).getAllByText('Flaky?', SEEN)).toHaveLength(1)
  })

  it('copies a reply as text, with its links made absolute', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    fetchMock.mockResolvedValue(answer('He builds **apps**.\n\n- One\n- See [services](/services)'))
    renderChat()
    const dialog = await open()
    await userEvent.type(screen.getByRole('textbox', { name: chat.message }), 'What?{Enter}')
    await within(dialog).findByText('apps', SEEN)
    await userEvent.click(within(dialog).getByRole('button', { name: chat.actions.copy }))
    expect(writeText).toHaveBeenCalledWith(`He builds apps.\n\n- One\n- See services (${window.location.origin}/services)`)
    expect(await within(dialog).findByRole('button', { name: chat.actions.copied })).toBeInTheDocument()
  })

  it('starts with the chips for the page the visitor is on, and sends that page', async () => {
    nav.path = '/services'
    renderChat()
    const dialog = await open()
    const chip = within(dialog).getByRole('button', { name: "What's on this page?" })
    expect(within(dialog).queryByRole('button', { name: STARTER_SUGGESTIONS[0] })).toBeNull()
    await userEvent.click(chip)
    await within(dialog).findByText('Hello there.', SEEN)
    expect(sentBody().page).toBe('/services')
  })

  it('widens the panel on desktop and remembers it', async () => {
    renderChat()
    const dialog = await open()
    const size = within(dialog).getByRole('button', { name: chat.size.expand })
    expect(size).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(size)
    expect(size).toHaveAttribute('aria-pressed', 'true')
    expect(dialog.className).toContain('shell:w-[min(720px,calc(100vw-40px))]')
    expect(localStorage.getItem(CHAT_WIDE_KEY)).toBe('wide')
    await userEvent.click(size)
    expect(dialog.className).toContain('shell:w-100')
    expect(localStorage.getItem(CHAT_WIDE_KEY)).toBeNull()
  })

  it('stays where the visitor scrolled while a reply arrives, and offers the way back', async () => {
    fetchMock.mockResolvedValue(answer('A reply.'))
    renderChat()
    const dialog = await open()
    const log = within(dialog).getByRole('log')
    // jsdom has no layout: make the log tall, and the visitor far up it.
    Object.defineProperty(log, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(log, 'clientHeight', { value: 400, configurable: true })
    log.scrollTop = 100
    fireEvent.scroll(log)
    const pill = await within(dialog).findByRole('button', { name: chat.latest })
    log.scrollTo = vi.fn()
    await userEvent.click(pill)
    expect(log.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 }))
    expect(within(dialog).queryByRole('button', { name: chat.latest })).toBeNull()
  })

  it('closes on Esc and puts focus back on the launcher', async () => {
    renderChat()
    await open()
    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(launcher()).toHaveFocus()
  })
})
