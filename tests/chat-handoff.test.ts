import { afterEach, describe, expect, it, vi } from 'vitest'
import { handoffText, saveHandoff, takeHandoff } from '@/lib/chat/handoff'
import type { ChatTurn } from '@/lib/chat/validate'
import { MAX_MESSAGE } from '@/lib/contact'
import { HANDOFF_KEY } from '@/lib/storage-keys'

const turns: ChatTurn[] = [
  { role: 'user', content: 'Do you build intake automations?' },
  { role: 'assistant', content: 'Yes, see the Kraft case.' },
  { role: 'user', content: 'How long does one take?' },
]

describe('chat hand-off', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('joins only the visitor turns', () => {
    expect(handoffText(turns)).toBe('Do you build intake automations?\n\nHow long does one take?')
  })

  it('trims the text to what the form accepts', () => {
    const long: ChatTurn[] = [{ role: 'user', content: 'x'.repeat(MAX_MESSAGE + 100) }]
    expect(handoffText(long)).toHaveLength(MAX_MESSAGE)
  })

  it('hands the text over once, then it is gone', () => {
    saveHandoff(turns)
    expect(takeHandoff()).toBe(handoffText(turns))
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull()
    expect(takeHandoff()).toBeNull()
  })

  it('clears an empty stored value and returns null', () => {
    sessionStorage.setItem(HANDOFF_KEY, '')
    expect(takeHandoff()).toBeNull()
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull()
  })

  it('does not throw when storage does', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveHandoff(turns)).not.toThrow()
    expect(takeHandoff()).toBeNull()
  })
})
