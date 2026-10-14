import type { ReactElement, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { components, useMDXComponents } from '@/mdx-components'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { NAV } from '@/data/nav'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/notes',
}))

type El = (p: { href?: string; children?: ReactNode }) => ReactElement

describe('MDX components', () => {
  it('is what useMDXComponents hands to every post', () => {
    expect(useMDXComponents()).toBe(components)
  })

  it('sends an internal link through the shell, and opens an external one safely in a new tab', () => {
    const A = components.a as El
    render(
      <NavigationProvider>
        <A href="/projects#san-fernando">case</A>
        <A href="https://n8n.io">n8n</A>
      </NavigationProvider>,
    )
    const inside = screen.getByRole('link', { name: 'case' })
    expect(inside).toHaveAttribute('href', '/projects#san-fernando')
    expect(inside).not.toHaveAttribute('target')
    const outside = screen.getByRole('link', { name: 'n8n' })
    expect(outside).toHaveAttribute('target', '_blank')
    expect(outside).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('turns a link to a switched-off page into plain text, like every other link to it', () => {
    const A = components.a as El
    const item = NAV.find((n) => n.href === '/contact')!
    item.hidden = true
    try {
      render(
        <NavigationProvider>
          <A href="/contact">tell me</A>
          <A href="/projects#san-fernando">case</A>
        </NavigationProvider>,
      )
      expect(screen.queryByRole('link', { name: 'tell me' })).toBeNull()
      expect(screen.getByText('tell me')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'case' })).toBeInTheDocument()
    } finally {
      item.hidden = false
    }
  })

  it("styles headings and paragraphs with Kraft's type", () => {
    const H2 = components.h2 as El
    const P = components.p as El
    render(
      <>
        <H2>Steps</H2>
        <P>Body</P>
      </>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Steps' }).className).toMatch(/font-semibold/)
    expect(screen.getByText('Body').className).toMatch(/text-ink2/)
  })
})
