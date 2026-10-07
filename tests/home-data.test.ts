import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CERTS } from '@/data/credentials'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { SERVICES } from '@/data/services'
import { brandIcon, EXPERIMENTAL, stackRows, TOOLS } from '@/data/stack'
import { CLIENTS } from '@/data/testimonials'
import { isPlaceholder } from '@/lib/placeholder'

const inPublic = (url: string) => existsSync(`public${url}`)

describe('Home data', () => {
  it("keeps Kraft's headline and lede verbatim", () => {
    expect(home.headline).toEqual(['Software that keeps', 'its promises.'])
    expect(home.lede).toBe(
      'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
    )
  })

  it('has a self-hosted file for every logo and image it names', () => {
    const urls = [
      ...TOOLS.map((t) => brandIcon(t.slug)),
      ...SERVICES.flatMap((s) => s.logos.map((l) => brandIcon(l.slug))),
      ...CERTS.map((c) => c.icon),
      home.cards.about.image.src,
    ]
    expect(urls.filter((u) => !inPublic(u))).toEqual([])
  })

  it('lists five services numbered 01-05, with no Mobile Apps & Extensions', () => {
    expect(SERVICES.map((s) => s.n)).toEqual(['01', '02', '03', '04', '05', '06'])
    expect(SERVICES.map((s) => s.name)).not.toContain('Mobile Apps & Extensions')
    expect(SERVICES[0].name).toBe('Full-Stack Web & SaaS')
    expect(SERVICES.every((s) => s.logos.length === 3)).toBe(true)
  })

  it('only marks listed tools as experimental', () => {
    const names = TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    expect(EXPERIMENTAL.filter((n) => !names.includes(n))).toEqual([])
  })

  it('splits the stack into two alternating rows that cover every tool', () => {
    const [a, b] = stackRows()
    expect(a[0].name).toBe('React')
    expect(b[0].name).toBe('TypeScript')
    expect(a.length + b.length).toBe(TOOLS.length)
  })

  it("uses Kraft's four loader steps for the intro", () => {
    expect(home.intro.steps.map((s) => s.label)).toEqual(['Brief comes in', 'Architect', 'Build & test', 'Shipped'])
  })

  it('keeps testimonial gaps as PLACEHOLDERs, never invented quotes', () => {
    expect(CLIENTS).toHaveLength(3)
    expect(CLIENTS.every((c) => isPlaceholder(c.name) && isPlaceholder(c.quote))).toBe(true)
  })

  it('has the phone handle Kraft shows in its phone header', () => {
    expect(profile.phoneHandle).toBe('@KRAFT')
  })
})
