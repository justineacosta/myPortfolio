import { describe, expect, it } from 'vitest'
import { NAV } from '@/data/nav'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { profile } from '@/data/profile'
import { FAQS } from '@/data/faqs'
import { SERVICES } from '@/data/services'
import { faqJsonLd, jsonLd, personJsonLd, servicesJsonLd } from '@/lib/jsonld'
import { HOME_TITLE, indexedPaths, ledeOr, pageMetadata, STATIC_PAGES } from '@/lib/seo'
import { SITE_URL, siteUrl } from '@/lib/site'
import { readTokens } from '@/lib/tokens'
import { SHARE_ALT, SHARE_SIZE } from '@/lib/share-meta'
import { shareFonts } from '@/lib/share-font'

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL, without a trailing slash', () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://kraft.dev/' })).toBe('https://kraft.dev')
  })
  it("falls back to Vercel's production domain", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'my-portfolio.vercel.app' })).toBe('https://my-portfolio.vercel.app')
  })
  it('is localhost in development', () => {
    expect(siteUrl({})).toBe('http://localhost:3000')
  })
})

describe('pageMetadata', () => {
  it('gives a page its search title, with its own description and canonical link', () => {
    const m = pageMetadata('/projects', 'Everything here shipped.')
    expect(m.title).toBe('Web, AI Agent & Automation Projects')
    expect(m.description).toBe('Everything here shipped.')
    expect(m.alternates?.canonical).toBe('/projects')
    const image = { width: SHARE_SIZE.width, height: SHARE_SIZE.height, alt: SHARE_ALT }
    expect(m.openGraph).toMatchObject({ title: 'Web, AI Agent & Automation Projects · Justine Acosta', url: '/projects', siteName: 'Kraft', images: [{ url: '/opengraph-image', ...image }] })
    expect(m.twitter).toMatchObject({ images: [{ url: '/twitter-image', ...image }] })
  })
  it('falls back to the nav label for a page without a search title', () => {
    expect(pageMetadata('/testimonials', 'x').title).toBe('Testimonials')
  })
  it('gives Home the name and the role', () => {
    expect(pageMetadata('/', 'x').title).toEqual({ absolute: HOME_TITLE })
    expect(HOME_TITLE).toBe('Justine Acosta · Full-stack & AI Automation Developer')
  })
  it('keeps every full search title under 60 characters', () => {
    for (const { href } of NAV) {
      const m = pageMetadata(href, 'x')
      expect((m.openGraph?.title as string).length, href).toBeLessThanOrEqual(60)
    }
  })
  it('takes an explicit label for pages outside the nav', () => {
    expect(pageMetadata('/thank-you', 'x', 'Thank you').title).toBe('Thank you')
  })
})

describe('sitemap and robots', () => {
  it('lists every public page once, the build plan too, and leaves the thank-you page out', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toEqual([...indexedPaths(), ...STATIC_PAGES].map((p) => `${SITE_URL}${p === '/' ? '' : p}`))
    expect(urls).toContain(`${SITE_URL}/build-plan.html`)
    expect(urls).toContain(`${SITE_URL}/agentic-framework.html`)
    expect(urls).toContain(`${SITE_URL}/ai-agents.html`)
    expect(urls).toContain(`${SITE_URL}/automations.html`)
    expect(urls.some((u) => u.includes('thank-you'))).toBe(false)
  })
  it('points crawlers at the sitemap and keeps them out of the sample sites', () => {
    const r = robots()
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: ['/samples/', '/cases/', '/lumen'] })
  })
})

describe('Person JSON-LD', () => {
  it('describes Justine, with the contact email now that it is real', () => {
    const p = personJsonLd('https://kraft.dev')
    expect(p).toMatchObject({ '@type': 'Person', name: 'Justine Acosta', url: 'https://kraft.dev', image: 'https://kraft.dev/assets/portrait.jpg', email: `mailto:${profile.email}` })
    expect(p.sameAs).toEqual(['https://github.com/justineacosta', 'https://www.linkedin.com/in/justinesam023'])
  })
  it('lists every FAQ, question and answer, for /contact', () => {
    const f = faqJsonLd()
    expect(f['@type']).toBe('FAQPage')
    expect(f.mainEntity).toHaveLength(FAQS.length)
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: FAQS[0].q, acceptedAnswer: { '@type': 'Answer', text: FAQS[0].a } })
  })
  it('lists every offer as a Service from Justine, for /services', () => {
    const s = servicesJsonLd('https://kraft.dev')
    expect(s.itemListElement.map((e) => e.item.name)).toEqual(SERVICES.map((o) => o.name))
    expect(s.itemListElement[0]).toMatchObject({ position: 1, item: { '@type': 'Service', provider: { '@type': 'Person', name: 'Justine Acosta', url: 'https://kraft.dev' } } })
  })
  it('cannot break out of its script tag', () => {
    expect(jsonLd({ a: '</script><script>' })).not.toContain('</script>')
  })
})

describe('readTokens', () => {
  it("reads Kraft's colours for each theme from the token file", () => {
    expect(readTokens('dark')).toMatchObject({ bg: '#050505', ink: '#F1F5F2', accent: '#D7FFE0', amb: '19,74,48' })
    expect(readTokens('light')).toMatchObject({ bg: '#F2F5F1', accent: '#0E6B44' })
  })
  it('says so when the token file has no such block', () => {
    expect(() => readTokens('dark', 'body{}')).toThrow(/dark/)
  })
})

describe('share image', () => {
  it('carries Geist in both weights from the repo: bold for the headline, regular for the rest', () => {
    const fonts = shareFonts()
    expect(fonts.map((f) => [f.name, f.weight, f.style])).toEqual([
      ['Geist', 400, 'normal'],
      ['Geist', 700, 'normal'],
    ])
    for (const f of fonts) {
      expect(f.data.readUInt32BE(0)).toBe(0x00010000)
      expect(f.data.length).toBeGreaterThan(30_000)
    }
  })
})

describe('ledeOr', () => {
  it('uses the lede once it is real', () => {
    expect(ledeOr('A real line.', 'Heading')).toBe('A real line.')
  })
  it('never lets a PLACEHOLDER reach search results', () => {
    expect(ledeOr('PLACEHOLDER - one line', 'Heading')).toBe('Heading')
  })
})
