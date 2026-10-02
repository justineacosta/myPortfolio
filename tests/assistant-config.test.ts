import { describe, expect, it } from 'vitest'
import { enabled, isFake } from '@/lib/assistant/config'

describe('assistant config', () => {
  it('is off without a key or the fake switch', () => {
    expect(enabled({})).toBe(false)
  })

  it('is on with an Anthropic key', () => {
    expect(enabled({ ANTHROPIC_API_KEY: 'sk' })).toBe(true)
  })

  it('is on with the fake switch', () => {
    expect(enabled({ ASSISTANT_FAKE: '1' })).toBe(true)
  })

  it('reads only ASSISTANT_FAKE=1 as fake', () => {
    expect(isFake({ ASSISTANT_FAKE: '0' })).toBe(false)
    expect(isFake({ ASSISTANT_FAKE: '1' })).toBe(true)
    expect(isFake({})).toBe(false)
  })
})
