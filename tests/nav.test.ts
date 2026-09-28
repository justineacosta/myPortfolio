import { describe, expect, it } from 'vitest'
import { isActivePath, MOBILE_NAV, NAV, navForPath } from '@/data/nav'

describe('nav data', () => {
  it('lists the seven sections in spec order', () => {
    expect(NAV.map((n) => n.label)).toEqual([
      'Home', 'Projects', 'Showcase', 'Services', 'Testimonials', 'About', 'FAQs / Contact',
    ])
    expect(NAV.map((n) => n.hint)).toEqual([
      'OVERVIEW', 'BUILDS', 'FLAGSHIP', 'OFFERS', 'CLIENTS', 'PROFILE', 'INQUIRY',
    ])
  })

  it("has Kraft's five phone slots with Start in the middle", () => {
    expect(MOBILE_NAV.map((m) => m.label)).toEqual(['Home', 'Work', 'Start', 'Services', 'About'])
    expect(MOBILE_NAV[2]).toMatchObject({ href: '/contact', center: true })
  })

  it('matches Home only exactly and sections by prefix', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/projects', '/')).toBe(false)
    expect(isActivePath('/projects', '/projects')).toBe(true)
    expect(isActivePath('/projects/funnels', '/projects')).toBe(true)
    expect(isActivePath('/projectsx', '/projects')).toBe(false)
  })

  it('finds the nav item for a path, falling back to Home', () => {
    expect(navForPath('/services').hint).toBe('OFFERS')
    expect(navForPath('/nowhere').hint).toBe('OVERVIEW')
  })
})
