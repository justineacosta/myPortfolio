import { describe, expect, it } from 'vitest'
import { clientIp, leadAllowed } from '@/lib/leadLimit'

const req = (headers: Record<string, string>) => new Request('http://localhost/', { headers })

describe('clientIp', () => {
  it('takes the first address in x-forwarded-for', () => {
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.7, 10.9.9.9' }))).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip, then to unknown', () => {
    expect(clientIp(req({ 'x-real-ip': '203.0.113.8' }))).toBe('203.0.113.8')
    expect(clientIp(req({}))).toBe('unknown')
  })
})

describe('leadAllowed', () => {
  it('lets five leads through from one address, then refuses, and counts each address on its own', () => {
    const results = Array.from({ length: 6 }, () => leadAllowed('198.51.100.1'))
    expect(results).toEqual([true, true, true, true, true, false])
    expect(leadAllowed('198.51.100.2')).toBe(true)
  })
})
