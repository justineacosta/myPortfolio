import { describe, expect, it } from 'vitest'
import { isPlaceholder } from '@/lib/placeholder'

describe('isPlaceholder', () => {
  it('flags strings that start with the PLACEHOLDER marker', () => {
    expect(isPlaceholder('PLACEHOLDER - GitHub profile URL')).toBe(true)
  })
  it('passes real content through', () => {
    expect(isPlaceholder('https://github.com/justine')).toBe(false)
    expect(isPlaceholder('')).toBe(false)
  })
})
