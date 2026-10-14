import { beforeEach, describe, expect, it, vi } from 'vitest'

const sent = vi.hoisted(() => vi.fn())
vi.mock('@vercel/analytics', () => ({ track: sent }))

import { beforeSend, track } from '@/lib/analytics'

describe('analytics', () => {
  beforeEach(() => {
    sent.mockReset()
  })

  it('sends an event with no properties', () => {
    track('Lumen opened')
    expect(sent).toHaveBeenCalledWith('Lumen opened', undefined)
  })
  it('sends the one property each event allows', () => {
    track('Project opened', { view: 'build-plan' })
    track('Sample site opened', { site: 'Ostler' })
    expect(sent).toHaveBeenNthCalledWith(1, 'Project opened', { view: 'build-plan' })
    expect(sent).toHaveBeenNthCalledWith(2, 'Sample site opened', { site: 'Ostler' })
  })
  it('never lets a failure reach the page', () => {
    sent.mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => track('Contact sent')).not.toThrow()
  })
  it("drops page views of Lumen's embed frame, and keeps its events", () => {
    expect(beforeSend({ type: 'pageview', url: 'https://kraft.dev/lumen' })).toBeNull()
    expect(beforeSend({ type: 'pageview', url: 'https://kraft.dev/lumen?page=%2Fcases' })).toBeNull()
    const event = { type: 'event' as const, url: 'https://kraft.dev/lumen' }
    expect(beforeSend(event)).toBe(event)
  })
  it('keeps every other page view', () => {
    const view = { type: 'pageview' as const, url: 'https://kraft.dev/projects#sites' }
    expect(beforeSend(view)).toBe(view)
    expect(beforeSend({ type: 'pageview', url: 'https://kraft.dev/lumens' })).not.toBeNull()
  })
})
