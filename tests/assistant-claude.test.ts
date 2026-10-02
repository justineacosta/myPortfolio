// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ ctor: vi.fn(), stream: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { stream: sdk.stream }
    constructor(opts: unknown) {
      sdk.ctor(opts)
    }
  },
}))

describe('streamTurn (the real Claude)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ASSISTANT_FAKE', '')
    sdk.ctor.mockClear()
    sdk.stream.mockReset().mockReturnValue({ on: vi.fn(), finalMessage: async () => ({ content: [], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }) })
  })
  afterEach(() => vi.unstubAllEnvs())

  const base = { system: [], tools: [], messages: [{ role: 'user' as const, content: 'Hi' }] }

  it('builds one client, with no retries: the chat route’s deadline bounds the whole call, and the quick answer takes over after it', async () => {
    const { streamTurn } = await import('@/lib/assistant/claude')
    const { CLAUDE_DEADLINE_MS } = await import('@/lib/assistant/config')
    await streamTurn(base, () => {})
    await streamTurn(base, () => {})
    expect(sdk.ctor).toHaveBeenCalledTimes(1)
    expect(sdk.ctor).toHaveBeenCalledWith({ timeout: CLAUDE_DEADLINE_MS, maxRetries: 0 })
    expect(CLAUDE_DEADLINE_MS).toBe(20_000)
  })

  it('passes tool_choice through when the turn sets it, and leaves it out when not', async () => {
    const { streamTurn } = await import('@/lib/assistant/claude')
    await streamTurn(base, () => {})
    await streamTurn({ ...base, tool_choice: { type: 'none' } }, () => {})
    expect(sdk.stream.mock.calls[0][0]).not.toHaveProperty('tool_choice')
    expect(sdk.stream.mock.calls[1][0]).toMatchObject({ tool_choice: { type: 'none' } })
  })
})
