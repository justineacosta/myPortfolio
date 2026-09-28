import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Bento from '@/components/home/Bento'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const renderBento = () =>
  render(
    <NavigationProvider>
      <Bento />
    </NavigationProvider>,
  )

describe('Bento', () => {
  it("renders Kraft's cards in order", () => {
    renderBento()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Projects', 'About', 'Stack'])
  })

  it('makes Projects and About whole-card links, and leaves Stack static', () => {
    renderBento()
    const projects = screen.getByRole('link', { name: /^Projects/ })
    expect(projects).toHaveAttribute('href', '/projects')
    expect(projects).toHaveTextContent('06 BUILDS')
    expect(screen.getByRole('link', { name: /^About/ })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('heading', { name: 'Stack' }).closest('a')).toBeNull()
  })

  it('fans five project shots, labelled while they are placeholders', () => {
    renderBento()
    for (const n of [1, 2, 3, 4, 5]) expect(screen.getByText(`Project ${n} · 16:10`)).toBeInTheDocument()
  })

  it('loops the tools marquee with a hidden duplicate', () => {
    const { container } = renderBento()
    const track = container.querySelector('[data-marquee] ul')!
    const items = within(track as HTMLElement).getAllByRole('listitem', { hidden: true })
    expect(items).toHaveLength(56)
    expect(items[0]).not.toHaveAttribute('aria-hidden')
    expect(items[28]).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks experimental tools on the Stack card', () => {
    renderBento()
    const stack = screen.getByRole('heading', { name: 'Stack' }).parentElement!.parentElement!
    const chip = within(stack).getAllByText('LangChain')[0].closest('li')!
    expect(chip).toHaveAttribute('data-experimental', 'true')
    expect(within(stack).getByText('IN USE')).toBeInTheDocument()
  })

  it('is held back for the intro', () => {
    const { container } = renderBento()
    expect(container.querySelector('.bento')).toHaveAttribute('data-intro-hold')
  })
})
