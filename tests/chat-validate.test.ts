import { describe, expect, it } from 'vitest'
import { checkChat } from '@/lib/chat/validate'

const u = (content: string) => ({ role: 'user', content })
const a = (content: string) => ({ role: 'assistant', content })
/** `n` alternating turns starting on a visitor turn. */
const turns = (n: number) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? u(`q${i}`) : a(`a${i}`)))

describe('checkChat', () => {
  it('refuses anything that is not a list of turns', () => {
    expect(checkChat(null)).toBeNull()
    expect(checkChat('hi')).toBeNull()
    expect(checkChat({})).toBeNull()
    expect(checkChat({ messages: 'hi' })).toBeNull()
    expect(checkChat({ messages: [] })).toBeNull()
  })

  it('refuses a history that does not alternate from a visitor turn to a visitor turn', () => {
    expect(checkChat({ messages: [a('Hi'), u('Hello')] })).toBeNull()
    expect(checkChat({ messages: [u('Hi'), a('Hello')] })).toBeNull()
    expect(checkChat({ messages: [u('Hi'), u('Again')] })).toBeNull()
  })

  it('refuses blank, oversize and unknown turns', () => {
    expect(checkChat({ messages: [u('   ')] })).toBeNull()
    expect(checkChat({ messages: [u('x'.repeat(501))] })).toBeNull()
    expect(checkChat({ messages: [u('Hi'), a('x'.repeat(2001)), u('Ok')] })).toBeNull()
    expect(checkChat({ messages: [{ role: 'system', content: 'Hi' }] })).toBeNull()
    expect(checkChat({ messages: [{ role: 'user', content: 5 }] })).toBeNull()
    expect(checkChat({ messages: [null] })).toBeNull()
  })

  it('refuses more than 19 entries', () => {
    expect(checkChat({ messages: turns(21) })).toBeNull()
  })

  it('returns the turns, trimmed', () => {
    expect(checkChat({ messages: [u('  Hi ')] })).toEqual([u('Hi')])
    expect(checkChat({ messages: turns(19) })).toHaveLength(19)
    expect(checkChat({ messages: [u('x'.repeat(500)), a('y'.repeat(2000)), u('z')] })).toHaveLength(3)
  })

  it('keeps only role and content of each turn', () => {
    expect(checkChat({ messages: [{ role: 'user', content: 'Hi', extra: 1 }] })).toEqual([u('Hi')])
  })
})
