import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Bento from '@/components/home/Bento'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { BUILDS } from '@/data/projects'

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
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Projects', 'About', 'Stack', 'Services', 'Testimonials', 'Courses',
    ])
  })

  it('makes Projects and About whole-card links, and leaves Stack static', () => {
    renderBento()
    const projects = screen.getByRole('link', { name: /^Projects/ })
    expect(projects).toHaveAttribute('href', '/projects')
    expect(projects).not.toHaveTextContent('BUILDS')
    expect(screen.getByRole('link', { name: /^About/ })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('heading', { name: 'Stack' }).closest('a')).toBeNull()
  })

  it('fans a tile for every build on the Projects page, each a real screenshot, a real site for Funnels', () => {
    const { container } = renderBento()
    const tiles = [...container.querySelectorAll<HTMLElement>('.arc [data-fan-tile]')]
    expect(tiles.map((t) => t.dataset.site)).toEqual(BUILDS.map((b) => b.name))
    const funnels = tiles.find((t) => t.dataset.site === 'Funnels and sites')!
    expect(decodeURIComponent(funnels.querySelector('img')!.getAttribute('src')!)).toContain('/samples/thumbs/tall/')
    expect(decodeURIComponent(tiles[0].querySelector('img')!.getAttribute('src')!)).toContain('/shots/automations.jpeg')
    for (const t of tiles) expect(t.querySelector('img'), t.dataset.site).not.toBeNull()
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

  it('lists the six services with their numbers and logos, and says to scroll for all six', () => {
    renderBento()
    const services = screen.getByRole('link', { name: /^Services/ })
    expect(services).toHaveAttribute('href', '/services')
    expect(within(services).getByText('01 / 06')).toBeInTheDocument()
    expect(within(services).getByText('APIs & Integrations')).toBeInTheDocument()
    expect(within(services).queryByText('Mobile Apps & Extensions')).toBeNull()
    expect(within(services).getByText('SCROLL FOR ALL SIX')).toBeInTheDocument()
    expect(services.querySelector('img[src="/icons/brands/n8n.svg"]')).not.toBeNull()
  })

  it('turns a vertical wheel over the services row into sideways scroll', () => {
    const { container } = renderBento()
    const row = container.querySelector<HTMLElement>('[data-wheel-x]')!
    Object.defineProperty(row, 'scrollWidth', { configurable: true, value: 1100 })
    Object.defineProperty(row, 'clientWidth', { configurable: true, value: 300 })
    row.scrollTo = vi.fn() as unknown as typeof row.scrollTo
    const notCancelled = fireEvent.wheel(row, { deltaY: 100 })
    expect(notCancelled).toBe(false)
    expect(row.scrollTo).toHaveBeenCalledWith({ left: expect.closeTo(110, 6), behavior: 'smooth' })
  })

  it('lists the real client on the Testimonials card', () => {
    renderBento()
    const t = screen.getByRole('link', { name: /^Testimonials/ })
    expect(t).toHaveAttribute('href', '/testimonials')
    expect(within(t).getByText('IN THEIR OWN WORDS')).toBeInTheDocument()
    expect(within(t).getByText('Dominic Dela Cruz')).toBeInTheDocument()
    expect(within(t).getByText('Citizen portal')).toBeInTheDocument()
  })

  it('shows both certifications as badge.svg medals, each with its logo', () => {
    renderBento()
    for (const [name, logo] of [
      ['AWS Cloud Practitioner Essentials', 'aws-mark.svg'],
      ['HackerRank Software Engineer', 'hackerrank.svg'],
    ]) {
      const medal = screen.getByRole('img', { name })
      expect(medal.querySelector('[data-cert-badge] img')?.getAttribute('src')).toContain(logo)
      expect(medal.querySelector('.medal-rosette, .medal-disc, .medal-tail')).toBeNull()
    }
    expect(screen.getByText('AWS Cloud Practitioner Essentials. HackerRank Software Engineer.')).toBeInTheDocument()
  })

  it('is held back for the intro', () => {
    const { container } = renderBento()
    expect(container.querySelector('.bento')).toHaveAttribute('data-intro-hold')
  })
})
