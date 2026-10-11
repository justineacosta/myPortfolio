import { describe, expect, it } from 'vitest'
import { parseLinks, splitReply } from '@/lib/chat/reply'

describe('splitReply', () => {
  it('strips the marker and reports the hand-off', () => {
    expect(splitReply('Sure.\n[[contact]]')).toEqual({ text: 'Sure.', contact: true })
  })

  it('leaves a reply without the marker alone', () => {
    expect(splitReply('Hi')).toEqual({ text: 'Hi', contact: false })
  })

  it.each(['Hi [[', 'Hi [[con', 'Hi [[contact'])('hides the partial marker %j while it streams', (raw) => {
    expect(splitReply(raw)).toEqual({ text: 'Hi', contact: false })
  })

  it('removes a marker in the middle and closes the gap', () => {
    expect(splitReply('a [[contact]] b')).toEqual({ text: 'a b', contact: true })
  })
})

describe('parseLinks', () => {
  const known = new Set(['/services'])

  it('turns a known path into a link', () => {
    expect(parseLinks('See [Services](/services).', known)).toEqual([
      { text: 'See ' },
      { text: 'Services', href: '/services' },
      { text: '.' },
    ])
  })

  it.each(['[x](https://evil.example)', '[x](javascript:alert(1))', '[x](/nope)'])('leaves %s as the label only', (raw) => {
    const out = parseLinks(raw, known)
    expect(out.map((s) => s.text).join('')).toBe('x')
    expect(out.some((s) => 'href' in s)).toBe(false)
  })
})
