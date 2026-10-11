import { describe, expect, it } from 'vitest'
import { RULES, systemBlocks } from '@/lib/chat/prompt'
import { KNOWLEDGE } from '@/lib/chat/knowledge'

describe('the chat system prompt', () => {
  it('is two blocks: the rules, then the cached knowledge', () => {
    const blocks = systemBlocks()
    expect(blocks).toHaveLength(2)
    expect(blocks[0].text).toBe(RULES)
    expect(blocks[0].cache_control).toBeUndefined()
    expect(blocks[1].text).toBe(KNOWLEDGE)
    expect(blocks[1].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('names the hand-off marker and the off-topic rule', () => {
    expect(RULES).toContain('[[contact]]')
    expect(RULES).toContain('off-topic')
  })
})
