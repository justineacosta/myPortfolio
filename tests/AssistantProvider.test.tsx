import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { AssistantProvider, STORAGE_KEY, useAssistant } from '@/components/assistant/AssistantProvider'
import { assistant } from '@/data/assistant'
import type { AssistantEvent } from '@/lib/assistant/events'

const nav = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => '/',
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <NavigationProvider>
    <AssistantProvider>{children}</AssistantProvider>
  </NavigationProvider>
)
const setup = () => renderHook(() => useAssistant(), { wrapper })

const encoder = new TextEncoder()
const lines = (events: AssistantEvent[]) => events.map((e) => JSON.stringify(e) + '\n').join('')
/** A 200 response that streams the events and then closes. */
const stream = (events: AssistantEvent[]) =>
  new Response(new ReadableStream({ start: (c) => (c.enqueue(encoder.encode(lines(events))), c.close()) }), { status: 200 })
const text = (delta: string): AssistantEvent => ({ type: 'text', delta })
const done: AssistantEvent = { type: 'done' }

/** The body that the nth fetch call posted. */
const posted = (fetchMock: ReturnType<typeof vi.fn>, n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body as string)

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  nav.push.mockReset()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AssistantProvider', () => {
  it('posts the visitor’s message with the conversation id and page, and builds one assistant entry from the deltas', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), text(' there'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    const body = posted(fetchMock)
    expect(body).toEqual({ conversationId: expect.stringMatching(/^[0-9a-f-]{36}$/i), page: '/', messages: [{ role: 'user', content: 'Hi' }], formShown: false })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/chat')
    const e = result.current.entries
    expect(e).toHaveLength(2)
    expect(e[0]).toMatchObject({ kind: 'user', text: 'Hi' })
    expect(e[1]).toMatchObject({ kind: 'assistant', text: 'Hello there' })
    expect((e[1] as { unfinished?: boolean }).unfinished).toBeFalsy()
  })

  it('is streaming until the done event arrives', async () => {
    let finish!: () => void
    fetchMock.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(encoder.encode(lines([text('Hi')])))
            finish = () => (c.enqueue(encoder.encode(lines([done]))), c.close())
          },
        }),
      ),
    )
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(result.current.streaming).toBe(true)
    await act(async () => finish())
    await waitFor(() => expect(result.current.streaming).toBe(false))
  })

  it('ignores a send while a reply is streaming', async () => {
    fetchMock.mockResolvedValueOnce(new Response(new ReadableStream({ start: () => {} })))
    const { result } = setup()
    act(() => result.current.send('One'))
    await waitFor(() => expect(result.current.streaming).toBe(true))
    act(() => result.current.send('Two'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.entries).toHaveLength(1)
  })

  it('ignores a blank message', () => {
    const { result } = setup()
    act(() => result.current.send('   '))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.entries).toHaveLength(0)
  })

  it('sends earlier user and assistant text on the next turn, never navigate, lead or error entries, nor empty replies', async () => {
    fetchMock
      .mockResolvedValueOnce(stream([text('Sure.'), { type: 'navigate', href: '/projects', label: 'Projects' }, { type: 'lead', ok: true }, { type: 'error', error: 'oops' }, done]))
      .mockResolvedValueOnce(stream([done]))
      .mockResolvedValueOnce(stream([text('Ok'), done]))
    const { result } = setup()
    act(() => result.current.send('First'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    act(() => result.current.send('Second'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1).messages).toEqual([
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Sure.' },
      { role: 'user', content: 'Second' },
    ])
    act(() => result.current.send('Third'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    // The second turn streamed no text, so it has no assistant entry to send.
    expect(posted(fetchMock, 2).messages).toEqual([
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Sure.' },
      { role: 'user', content: 'Second' },
      { role: 'user', content: 'Third' },
    ])
  })

  it('adds a navigate entry and takes the visitor there with the shell’s router', async () => {
    fetchMock.mockResolvedValueOnce(stream([{ type: 'navigate', href: '/projects', label: 'Projects' }, done]))
    const { result } = setup()
    act(() => result.current.send('Show me your projects'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'navigate', href: '/projects', label: 'Projects' })
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/projects', { scroll: false }))
  })

  it('adds a lead entry', async () => {
    fetchMock.mockResolvedValueOnce(stream([{ type: 'lead', ok: false }, done]))
    const { result } = setup()
    act(() => result.current.send('Here is my email'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'lead', ok: false })
  })

  it('marks a reply cut off before done as unfinished, and retry re-sends without duplicating the visitor’s message', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Half a')])).mockResolvedValueOnce(stream([text('A whole reply'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'assistant', text: 'Half a', unfinished: true })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1)).toEqual(posted(fetchMock, 0))
    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[0]).toMatchObject({ kind: 'user', text: 'Hi' })
    expect(result.current.entries[1]).toMatchObject({ kind: 'assistant', text: 'A whole reply' })
    expect((result.current.entries[1] as { unfinished?: boolean }).unfinished).toBeFalsy()
  })

  it('sends a cut-off reply’s text as history on later turns', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Half a')])).mockResolvedValueOnce(stream([done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    act(() => result.current.send('Go on'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1).messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Half a' },
      { role: 'user', content: 'Go on' },
    ])
  })

  it('turns a stream that ends with no text and no done into an error entry, which retry removes', async () => {
    fetchMock.mockResolvedValueOnce(stream([])).mockResolvedValueOnce(stream([text('Hi!'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'error', text: assistant.errors.failed })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((e) => e.kind)).toEqual(['user', 'assistant'])
    expect(posted(fetchMock, 1).messages).toEqual([{ role: 'user', content: 'Hi' }])
  })

  it('shows the server’s error line as an error entry on a 429', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: assistant.errors.rate }), { status: 429 }))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'error', text: assistant.errors.rate })
  })

  it('shows errors.failed for a non-OK response without an error body, and for a network failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 })).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'error', text: assistant.errors.failed })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((e) => e.kind)).toEqual(['user', 'error'])
    expect(result.current.entries[1]).toMatchObject({ text: assistant.errors.failed })
  })

  it('shows an error event as an error entry', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Part'), { type: 'error', error: assistant.errors.failed }, done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((e) => e.kind)).toEqual(['user', 'assistant', 'error'])
    expect(result.current.entries[1]).toMatchObject({ text: 'Part', unfinished: true })
  })

  it('stop aborts the request and leaves the partial reply unfinished, with no error entry', async () => {
    let signal!: AbortSignal
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal
      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(encoder.encode(lines([text('Partial')])))
              signal.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')))
            },
          }),
        ),
      )
    })
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.entries[1]).toMatchObject({ text: 'Partial' }))
    act(() => result.current.stop())
    expect(signal.aborted).toBe(true)
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((e) => e.kind)).toEqual(['user', 'assistant'])
    expect(result.current.entries[1]).toMatchObject({ text: 'Partial', unfinished: true })
  })

  it('stop before the response arrives leaves no error entry', async () => {
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) => new Promise((_, reject) => (init.signal as AbortSignal).addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    )
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(true))
    act(() => result.current.stop())
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((e) => e.kind)).toEqual(['user'])
  })

  it('keeps the entries and conversation id for the tab: a remounted provider restores them', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), done]))
    const first = setup()
    act(() => first.result.current.send('Hi'))
    await waitFor(() => expect(first.result.current.streaming).toBe(false))
    const id = posted(fetchMock).conversationId
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toMatchObject({ conversationId: id, entries: [{ kind: 'user' }, { kind: 'assistant' }] })
    first.unmount()

    fetchMock.mockResolvedValueOnce(stream([done]))
    const second = setup()
    await waitFor(() => expect(second.result.current.entries).toHaveLength(2))
    expect(second.result.current.entries[1]).toMatchObject({ kind: 'assistant', text: 'Hello' })
    act(() => second.result.current.send('Again'))
    await waitFor(() => expect(second.result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1).conversationId).toBe(id)
    expect(posted(fetchMock, 1).messages).toHaveLength(3)
  })

  it('reset clears the entries and the stored chat, and starts a new conversation id', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), done])).mockResolvedValueOnce(stream([done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    const id = posted(fetchMock).conversationId
    act(() => result.current.reset())
    expect(result.current.entries).toEqual([])
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    act(() => result.current.send('Hi again'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1).conversationId).not.toBe(id)
    expect(posted(fetchMock, 1).messages).toEqual([{ role: 'user', content: 'Hi again' }])
  })

  it('ignores stored data that is not a chat', async () => {
    sessionStorage.setItem(STORAGE_KEY, '{"conversationId":7,"entries":"x"}')
    const { result } = setup()
    expect(result.current.entries).toEqual([])
    sessionStorage.setItem(STORAGE_KEY, 'not json')
    expect(setup().result.current.entries).toEqual([])
  })

  it('still sends when sessionStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries[1]).toMatchObject({ kind: 'assistant', text: 'Hello' })
    act(() => result.current.reset())
    expect(result.current.entries).toEqual([])
  })

  it('still builds a v4 UUID when crypto.randomUUID is missing (http over a LAN IP)', async () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    const { conversationId } = posted(fetchMock)
    expect(conversationId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(conversationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(result.current.entries.map((e) => e.id)).toEqual([expect.stringMatching(/^[0-9a-f-]{36}$/i), expect.stringMatching(/^[0-9a-f-]{36}$/i)])
  })

  it('open and setOpen work', () => {
    const { result } = setup()
    expect(result.current.open).toBe(false)
    act(() => result.current.setOpen(true))
    expect(result.current.open).toBe(true)
  })
})

const fields = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', message: 'Hello', call: true }
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })
const source: AssistantEvent = { type: 'source', engine: 'site' }

describe('AssistantProvider: quick replies', () => {
  it('discards the partial Claude bubble at a source event, and marks the next reply quick', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Half'), source, text('**How much…'), done]))
    const { result } = setup()
    act(() => result.current.send('Price?'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    const e = result.current.entries
    expect(e.map((x) => x.kind)).toEqual(['user', 'assistant'])
    expect(e[1]).toMatchObject({ kind: 'assistant', text: '**How much…', quick: true })
    expect(e.some((x) => x.kind === 'assistant' && x.text.includes('Half'))).toBe(false)
    expect(e.some((x) => x.kind === 'assistant' && x.unfinished)).toBe(false)
  })

  it('marks a reply cut off after the source event unfinished, and keeps it quick', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Half'), source, text('Quick part')]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((x) => x.kind)).toEqual(['user', 'assistant'])
    expect(result.current.entries[1]).toMatchObject({ text: 'Quick part', quick: true, unfinished: true })
  })

  it('leaves no assistant entry when the source event is followed by no text', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Half'), source, done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((x) => x.kind)).toEqual(['user'])
  })

  it('does not mark a normal reply quick', async () => {
    fetchMock.mockResolvedValueOnce(stream([text('Hello'), done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect((result.current.entries[1] as { quick?: boolean }).quick).toBeFalsy()
  })

  it('restores the quick flag on a stored assistant entry, and ignores a non-boolean one', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId: 'c', entries: [{ id: 'a', kind: 'assistant', text: 'Hi', quick: true }, { id: 'b', kind: 'assistant', text: 'Yo', quick: 'yes' }] }))
    const { result } = setup()
    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    expect(result.current.entries[0]).toMatchObject({ id: 'a', quick: true })
  })
})

describe('AssistantProvider: the form card', () => {
  /** A chat that has been offered the form card; `id` is the form entry's id. */
  async function withForm() {
    fetchMock.mockResolvedValueOnce(stream([text('Leave your details:'), { type: 'form' }, done]))
    const hook = setup()
    act(() => hook.result.current.send('I have a project'))
    await waitFor(() => expect(hook.result.current.streaming).toBe(false))
    return { ...hook, id: hook.result.current.entries[2].id }
  }

  it('adds an open form entry for a form event, and posts formShown true on the next send, false after another reply', async () => {
    fetchMock
      .mockResolvedValueOnce(stream([text('Leave your details:'), { type: 'form' }, done]))
      .mockResolvedValueOnce(stream([text('Sure.'), done]))
      .mockResolvedValueOnce(stream([done]))
    const { result } = setup()
    act(() => result.current.send('I have a project'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(result.current.entries.map((x) => x.kind)).toEqual(['user', 'assistant', 'form'])
    expect(result.current.entries[2]).toMatchObject({ kind: 'form', state: 'open', id: expect.any(String) })
    act(() => result.current.send('Later'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 0).formShown).toBe(false)
    expect(posted(fetchMock, 1).formShown).toBe(true)
    // The form entry is never sent as history.
    expect(posted(fetchMock, 1).messages).toEqual([
      { role: 'user', content: 'I have a project' },
      { role: 'assistant', content: 'Leave your details:' },
      { role: 'user', content: 'Later' },
    ])
    act(() => result.current.send('And more'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 2).formShown).toBe(false)
  })

  it('computes formShown from the entries on retry too', async () => {
    fetchMock.mockResolvedValueOnce(stream([{ type: 'form' }, done])).mockResolvedValueOnce(stream([{ type: 'error', error: 'oops' }, done])).mockResolvedValueOnce(stream([done]))
    const { result } = setup()
    act(() => result.current.send('Hi'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    act(() => result.current.send('Again'))
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 1).formShown).toBe(true)
    // Retry drops the error and re-sends from the last user message; the last non-user entry is now the form again.
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.streaming).toBe(false))
    expect(posted(fetchMock, 2).formShown).toBe(true)
  })

  it('submitForm posts the fields, the conversation id, the page and the history, and the entry becomes sent', async () => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(json({ ok: true }, 200))
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm(id, fields)
    })
    expect(out).toEqual({ ok: true })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/chat/lead')
    expect(posted(fetchMock, 1)).toEqual({
      ...fields,
      conversationId: posted(fetchMock, 0).conversationId,
      page: '/',
      messages: [
        { role: 'user', content: 'I have a project' },
        { role: 'assistant', content: 'Leave your details:' },
      ],
    })
    expect(result.current.entries[2]).toMatchObject({ kind: 'form', state: 'sent' })
  })

  it('submitForm resolves field errors and leaves the entry open', async () => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(json({ errors: { email: 'Enter a valid email.' } }, 400))
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm(id, fields)
    })
    expect(out).toEqual({ ok: false, errors: { email: 'Enter a valid email.' } })
    expect(result.current.entries[2]).toMatchObject({ kind: 'form', state: 'open' })
  })

  it.each([
    [502, assistant.leadFailed],
    [409, assistant.quick.form.already],
    [429, assistant.errors.rate],
  ])('submitForm marks the entry failed on a %i, and resolves the server’s error', async (status, error) => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(json({ error }, status))
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm(id, fields)
    })
    expect(out).toEqual({ ok: false, error })
    expect(result.current.entries[2]).toMatchObject({ kind: 'form', state: 'failed' })
  })

  it('submitForm falls back to leadFailed for a non-OK response with no error body', async () => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm(id, fields)
    })
    expect(out).toEqual({ ok: false, error: assistant.leadFailed })
    expect(result.current.entries[2]).toMatchObject({ state: 'failed' })
  })

  it('submitForm marks the entry failed on a network failure', async () => {
    const { result, id } = await withForm()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm(id, fields)
    })
    expect(out).toEqual({ ok: false, error: assistant.leadFailed })
    expect(result.current.entries[2]).toMatchObject({ kind: 'form', state: 'failed' })
  })

  it('a second submitForm for the same entry while one is in flight sends nothing and resolves not ok', async () => {
    const { result, id } = await withForm()
    let release!: (r: Response) => void
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (release = r)))
    let first!: Promise<unknown>
    let second: unknown
    await act(async () => {
      first = result.current.submitForm(id, fields)
      second = await result.current.submitForm(id, fields)
    })
    expect(second).toEqual({ ok: false })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await act(async () => {
      release(json({ ok: true }, 200))
      await first
    })
    expect(result.current.entries[2]).toMatchObject({ state: 'sent' })
  })

  it('allows another submit once field errors have settled', async () => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(json({ errors: { email: 'x' } }, 400)).mockResolvedValueOnce(json({ ok: true }, 200))
    await act(async () => void (await result.current.submitForm(id, fields)))
    await act(async () => void (await result.current.submitForm(id, fields)))
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result.current.entries[2]).toMatchObject({ state: 'sent' })
  })

  it('submitForm for an unknown entry sends nothing', async () => {
    const { result } = setup()
    let out: unknown
    await act(async () => {
      out = await result.current.submitForm('nope', fields)
    })
    expect(out).toEqual({ ok: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('restores form entries with their state after a reload, and drops one with an unknown state', async () => {
    const { result, id } = await withForm()
    fetchMock.mockResolvedValueOnce(json({ ok: true }, 200))
    await act(async () => void (await result.current.submitForm(id, fields)))
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(stored.entries[2]).toMatchObject({ kind: 'form', state: 'sent' })
    stored.entries.push({ id: 'bad', kind: 'form', state: 'nonsense' })
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const again = setup()
    await waitFor(() => expect(again.result.current.entries).toHaveLength(3))
    expect(again.result.current.entries[2]).toMatchObject({ kind: 'form', state: 'sent', id })
  })
})
