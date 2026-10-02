import { describe, expect, it } from 'vitest'
import { isFake, mode } from '@/lib/assistant/config'

describe('assistant config', () => {
  it('is in quick mode without a key or the fake switch', () => {
    expect(mode({})).toBe('quick')
  })

  it('is in ai mode with an Anthropic key', () => {
    expect(mode({ ANTHROPIC_API_KEY: 'sk' })).toBe('ai')
  })

  it('is in ai mode with the fake switch', () => {
    expect(mode({ ASSISTANT_FAKE: '1' })).toBe('ai')
  })

  it('reads only ASSISTANT_FAKE=1 as fake', () => {
    expect(isFake({ ASSISTANT_FAKE: '0' })).toBe(false)
    expect(isFake({ ASSISTANT_FAKE: '1' })).toBe(true)
    expect(isFake({})).toBe(false)
  })
})
