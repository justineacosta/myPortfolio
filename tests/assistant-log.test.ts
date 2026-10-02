import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logTurn } from '@/lib/assistant/log'
import type { TurnRecord } from '@/lib/assistant/turn'

const ENV = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'srk' }
const ID = '3f2b8c1e-5a47-4d0e-9a52-1c6f0d7e8b21'
const RECORD: TurnRecord = {
  text: 'Justine builds websites and automations.',
  tools: [
    { name: 'navigate', input: { page: 'projects' }, result: 'Navigating to projects', isError: false },
    { name: 'search', input: { q: 'rag' }, result: 'No match', isError: true },
  ],
  usage: { input: 120, output: 45 },
  leadSent: false,
  engine: 'claude',
}
const entry = (record: TurnRecord = RECORD) => ({ conversationId: ID, page: '/', userText: 'What do you build?', record })

describe('logTurn', () => {
  let fetch: ReturnType<typeof vi.fn>
  let warn: ReturnType<typeof vi.spyOn>
  let error: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('upserts the conversation row first, ignoring a duplicate', async () => {
    await logTurn(entry(), ENV)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://db.test/rest/v1/conversations?on_conflict=id')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      apikey: 'srk',
      Authorization: 'Bearer srk',
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    })
    expect(JSON.parse(init.body)).toEqual({ id: ID, first_page: '/' })
  })

  it('inserts the user row, one row per tool and the assistant row, in that order', async () => {
    await logTurn(entry(), ENV)
    expect(fetch).toHaveBeenCalledTimes(2)
    const [url, init] = fetch.mock.calls[1]
    expect(url).toBe('https://db.test/rest/v1/messages')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ apikey: 'srk', Authorization: 'Bearer srk' })
    expect(JSON.parse(init.body)).toEqual([
      { conversation_id: ID, role: 'user', content: 'What do you build?' },
      { conversation_id: ID, role: 'tool', content: 'Navigating to projects', tool_name: 'navigate', tool_input: { page: 'projects' }, engine: 'claude' },
      { conversation_id: ID, role: 'tool', content: 'No match', tool_name: 'search', tool_input: { q: 'rag' }, engine: 'claude' },
      { conversation_id: ID, role: 'assistant', content: RECORD.text, input_tokens: 120, output_tokens: 45, engine: 'claude' },
    ])
  })

  it('writes the record’s engine on the tool and assistant rows, and none on the user row', async () => {
    await logTurn(entry({ ...RECORD, engine: 'site' }), ENV)
    const rows = JSON.parse(fetch.mock.calls[1][1].body)
    expect(rows[0]).not.toHaveProperty('engine')
    expect(rows.slice(1).map((r: { engine: string }) => r.engine)).toEqual(['site', 'site', 'site'])
  })

  it('skips a row whose content is empty', async () => {
    await logTurn({ ...entry({ ...RECORD, text: '' }), userText: '' }, ENV)
    const rows = JSON.parse(fetch.mock.calls[1][1].body)
    expect(rows.map((r: { role: string }) => r.role)).toEqual(['tool', 'tool'])
  })

  it('marks the conversation as a lead when a lead was sent', async () => {
    await logTurn(entry({ ...RECORD, leadSent: true }), ENV)
    expect(fetch).toHaveBeenCalledTimes(3)
    const [url, init] = fetch.mock.calls[2]
    expect(url).toBe(`https://db.test/rest/v1/conversations?id=eq.${ID}`)
    expect(init.method).toBe('PATCH')
    expect(init.headers).toMatchObject({ apikey: 'srk', Authorization: 'Bearer srk' })
    expect(JSON.parse(init.body)).toEqual({ lead_captured: true })
  })

  it('does not patch the conversation when no lead was sent', async () => {
    await logTurn(entry(), ENV)
    expect(fetch.mock.calls.some(([, init]) => init.method === 'PATCH')).toBe(false)
  })

  it('does nothing but warn once when the database is not configured', async () => {
    await logTurn(entry(), {})
    await logTurn(entry(), { SUPABASE_URL: 'https://db.test' })
    expect(fetch).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('warns once per call when the database is not configured', async () => {
    await logTurn(entry(), {})
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does nothing at all in fake mode', async () => {
    await logTurn(entry(), { ...ENV, ASSISTANT_FAKE: '1' })
    await logTurn(entry(), { ASSISTANT_FAKE: '1' })
    expect(fetch).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('resolves and logs an error when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('offline'))
    await expect(logTurn(entry(), ENV)).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })

  it('resolves and logs an error when the database answers 500', async () => {
    fetch.mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(logTurn(entry(), ENV)).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })

  it('stops when the conversation insert fails, so no message is written', async () => {
    fetch.mockResolvedValue(new Response('boom', { status: 500 }))
    await logTurn(entry({ ...RECORD, leadSent: true }), ENV)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
