import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useChat } from '@/components/chat/useChat'
import { CHAT_KEY } from '@/lib/storage-keys'
import { chat } from '@/data/chat'

/** A streamed 200 body the test feeds chunk by chunk. */
function openStream() {
  const enc = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) })
  const res = new Response(body, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  return {
    res,
    push: async (s: string) => {
      await act(async () => {
        controller.enqueue(enc.encode(s))
      })
    },
    fail: async () => {
      await act(async () => {
        controller.error(new Error('boom'))
      })
    },
    end: async () => {
      await act(async () => {
        controller.close()
      })
    },
  }
}

/** A complete 200 reply, delivered in two chunks. */
function textReply(...chunks: string[]) {
  const enc = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const s of chunks) c.enqueue(enc.encode(s))
      c.close()
    },
  })
  return new Response(body, { status: 200 })
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useChat', () => {
  it('posts the history and streams the visible text, never a marker fragment', async () => {
    const s = openStream()
    fetchMock.mockResolvedValueOnce(s.res)
    const { result } = renderHook(() => useChat())

    let done!: Promise<void>
    await act(async () => {
      done = result.current.send('Hi')
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/chat')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', content: 'Hi' }] })
    expect(result.current.streaming).toBe('')
    expect(result.current.turns).toEqual([{ role: 'user', content: 'Hi' }])

    await s.push('Sure [[con')
    await waitFor(() => expect(result.current.streaming).toBe('Sure'))
    await s.push('tact]]')
    await waitFor(() => expect(result.current.streaming).toBe('Sure'))
    expect(result.current.streaming).not.toMatch(/\[/)

    await s.end()
    await act(async () => {
      await done
    })
    expect(result.current.streaming).toBeNull()
    expect(result.current.contact).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.turns).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Sure' },
    ])
    expect(JSON.parse(sessionStorage.getItem(CHAT_KEY)!)).toEqual(result.current.turns)
  })

  it('restores the turns from the tab on a new mount', async () => {
    const turns = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(turns))
    const { result } = renderHook(() => useChat())
    await waitFor(() => expect(result.current.turns).toEqual(turns))
  })

  it('ignores stored data that is not a valid history', async () => {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify([{ role: 'system', content: 'x' }]))
    const { result } = renderHook(() => useChat())
    await act(async () => {})
    expect(result.current.turns).toEqual([])
    sessionStorage.setItem(CHAT_KEY, '{not json')
    const again = renderHook(() => useChat())
    await act(async () => {})
    expect(again.result.current.turns).toEqual([])
  })

  it('sends the earlier turns with the next question', async () => {
    fetchMock.mockResolvedValueOnce(textReply('One')).mockResolvedValueOnce(textReply('Two'))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('A'))
    await act(() => result.current.send('B'))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).messages).toEqual([
      { role: 'user', content: 'A' },
      { role: 'assistant', content: 'One' },
      { role: 'user', content: 'B' },
    ])
    expect(result.current.contact).toBe(false)
  })

  it('shows the server sentence on a 429 and drops the unanswered turn', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'Slow down.' }, { status: 429 }))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('Hi'))
    expect(result.current.error).toBe('Slow down.')
    expect(result.current.turns).toEqual([])
    expect(result.current.streaming).toBeNull()
  })

  it('falls back to the failed sentence when the error body is not usable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 502 }))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('Hi'))
    expect(result.current.error).toBe(chat.errors.failed)
    expect(result.current.turns).toEqual([])
  })

  it('sets the failed sentence when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('Hi'))
    expect(result.current.error).toBe(chat.errors.failed)
    expect(result.current.turns).toEqual([])
    expect(result.current.streaming).toBeNull()
  })

  it('discards a reply whose stream breaks part-way', async () => {
    const s = openStream()
    fetchMock.mockResolvedValueOnce(s.res)
    const { result } = renderHook(() => useChat())
    let done!: Promise<void>
    await act(async () => {
      done = result.current.send('Hi')
    })
    await s.push('Half an ans')
    await waitFor(() => expect(result.current.streaming).toBe('Half an ans'))
    await s.fail()
    await act(async () => {
      await done
    })
    expect(result.current.error).toBe(chat.errors.failed)
    expect(result.current.turns).toEqual([])
    expect(result.current.streaming).toBeNull()
  })

  it.each([['only the marker', ['[[contact]]']], ['nothing', []]])(
    'counts a reply of %s as failed and drops the turn',
    async (_label, chunks) => {
      fetchMock.mockResolvedValueOnce(textReply(...chunks))
      const { result } = renderHook(() => useChat())
      await act(() => result.current.send('Hi'))
      expect(result.current.error).toBe(chat.errors.failed)
      expect(result.current.turns).toEqual([])
      expect(result.current.contact).toBe(false)
    },
  )

  it('clears the error when the next send starts', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(textReply('Fine'))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('Hi'))
    expect(result.current.error).not.toBeNull()
    await act(() => result.current.send('Hi'))
    expect(result.current.error).toBeNull()
    expect(result.current.turns).toHaveLength(2)
  })

  it('ignores a blank message and trims the rest', async () => {
    fetchMock.mockResolvedValueOnce(textReply('Ok'))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('   '))
    expect(fetchMock).not.toHaveBeenCalled()
    await act(() => result.current.send('  Hi  '))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toBe('Hi')
  })

  it('is capped after 10 visitor turns and then send does nothing', async () => {
    const turns = Array.from({ length: 10 }, (_, i) => [
      { role: 'user', content: `Q${i}` },
      { role: 'assistant', content: `A${i}` },
    ]).flat()
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(turns))
    const { result } = renderHook(() => useChat())
    await waitFor(() => expect(result.current.capped).toBe(true))
    await act(() => result.current.send('One more'))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.turns).toHaveLength(20)
  })

  it('is not capped at nine visitor turns', async () => {
    const turns = Array.from({ length: 9 }, (_, i) => [
      { role: 'user', content: `Q${i}` },
      { role: 'assistant', content: `A${i}` },
    ]).flat()
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(turns))
    const { result } = renderHook(() => useChat())
    await waitFor(() => expect(result.current.turns).toHaveLength(18))
    expect(result.current.capped).toBe(false)
  })

  it('works with storage throwing', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    fetchMock.mockResolvedValueOnce(textReply('Hello ', 'there'))
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send('Hi'))
    expect(result.current.error).toBeNull()
    expect(result.current.turns).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello there' },
    ])
  })

  it('does nothing while a reply is streaming', async () => {
    const s = openStream()
    fetchMock.mockResolvedValueOnce(s.res)
    const { result } = renderHook(() => useChat())
    let done!: Promise<void>
    await act(async () => {
      done = result.current.send('Hi')
    })
    await act(() => result.current.send('Again'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.turns).toHaveLength(1)
    await s.push('Ok')
    await s.end()
    await act(async () => {
      await done
    })
    expect(result.current.turns).toHaveLength(2)
  })
})
