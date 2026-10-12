import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import AboutPage from '@/app/(site)/about/page'
import ContactPage from '@/app/(site)/contact/page'
import ProjectsPage from '@/app/(site)/projects/page'
import ServicesPage from '@/app/(site)/services/page'
import ShowcasePage from '@/app/(site)/showcase/page'
import TestimonialsPage from '@/app/(site)/testimonials/page'
import ThankYou from '@/app/(plain)/thank-you/page'
import NotFound from '@/app/not-found'
import Bento from '@/components/home/Bento'
import Hero from '@/components/home/Hero'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import Sidebar from '@/components/shell/Sidebar'
import TabBar from '@/components/shell/TabBar'
import { isHidden, NAV } from '@/data/nav'
import { commands } from '@/lib/commands'
import { indexedPaths } from '@/lib/seo'

vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

class Observer {
  observe() {}
  disconnect() {}
}

const PAGES: Record<string, () => unknown> = {
  '/projects': ProjectsPage,
  '/showcase': ShowcasePage,
  '/services': ServicesPage,
  '/testimonials': TestimonialsPage,
  '/about': AboutPage,
  '/contact': ContactPage,
}

/** Switches `href` off in data/nav.ts for the length of `fn`. */
function withHidden(href: string, fn: () => void) {
  const item = NAV.find((n) => n.href === href)!
  const was = item.hidden
  item.hidden = true
  try {
    fn()
  } finally {
    item.hidden = was
    cleanup()
  }
}

/** Every page path a link on screen leads to. */
const linkedPaths = () => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!.split('#')[0])

describe('hiding a page (hidden: true in data/nav.ts)', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', Observer))
  afterEach(() => vi.unstubAllGlobals())

  it('can never hide Home, as data/nav.ts ships', () => {
    expect(readFileSync('data/nav.ts', 'utf8')).toMatch(/\{ href: '\/', [^\n]*hidden: false \}/)
  })

  it('ships Notes switched off, after Services', () => {
    expect(readFileSync('data/nav.ts', 'utf8')).toMatch(/\{ href: '\/notes', [^\n]*hidden: true \}/)
    expect(NAV.map((n) => n.href).indexOf('/notes')).toBe(NAV.map((n) => n.href).indexOf('/services') + 1)
  })

  it('links Services to the guides only while Notes is on', () => {
    render(<NavigationProvider>{ServicesPage()}</NavigationProvider>)
    expect(screen.getByRole('link', { name: /Read the guides/ })).toHaveAttribute('href', '/notes')
    cleanup()
    withHidden('/notes', () => {
      render(<NavigationProvider>{ServicesPage()}</NavigationProvider>)
      expect(screen.queryByRole('link', { name: /Read the guides/ })).toBeNull()
    })
  })

  it('reads a section link as its page: /services#method is Services', () => {
    withHidden('/services', () => {
      expect(isHidden('/services')).toBe(true)
      expect(isHidden('/services#method')).toBe(true)
      expect(isHidden('/about')).toBe(false)
    })
  })

  for (const href of Object.keys(PAGES)) {
    describe(href, () => {
      it('answers its URL with the 404', () => {
        withHidden(href, () => {
          expect(() => PAGES[href]()).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/)
        })
      })

      it('leaves no link to it: menus, tabs, Home, the notices', () => {
        withHidden(href, () => {
          render(
            <NavigationProvider>
              <Sidebar />
              <TabBar />
              <Hero />
              <Bento />
            </NavigationProvider>,
          )
          render(<NotFound />)
          render(ThankYou() as React.ReactElement)
          expect(linkedPaths()).not.toContain(href)
        })
      })

      it('drops out of ⌘K and the sitemap', () => {
        withHidden(href, () => {
          expect(commands().filter((c) => c.href.split('#')[0] === href)).toEqual([])
          expect(indexedPaths()).not.toContain(href)
        })
      })

      it('renumbers the sidebar with no gap', () => {
        withHidden(href, () => {
          render(
            <NavigationProvider>
              <Sidebar />
            </NavigationProvider>,
          )
          const links = within(screen.getByRole('complementary')).getAllByRole('navigation')[0]
          const numbers = within(links)
            .getAllByRole('link')
            .map((l) => l.textContent!.slice(-2))
          expect(numbers).toEqual(Array.from({ length: NAV.length - 1 }, (_, i) => String(i + 1).padStart(2, '0')))
        })
      })
    })
  }

  it('shows every page when none is hidden', () => {
    expect(commands().slice(0, NAV.length).map((c) => c.href)).toEqual(NAV.map((n) => n.href))
    expect(indexedPaths()).toEqual(expect.arrayContaining(NAV.map((n) => n.href)))
  })
})
