import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ProjectsCard from '@/components/home/ProjectsCard'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { BUILDS } from '@/data/projects'
import { SPIN_MS } from '@/lib/fan'
import { installMatchMedia } from '@/test/matchMedia'

const push = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, prefetch: vi.fn() }), usePathname: () => '/' }))

class OnScreen {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  disconnect() {}
}

const renderCard = () =>
  render(
    <NavigationProvider>
      <ProjectsCard />
    </NavigationProvider>,
  )
const fan = () => document.querySelector<HTMLElement>('.arc')!
const front = () => document.querySelector<HTMLElement>('.arc [data-fan-tile][data-front]')?.dataset.site

describe("Home's Projects card", () => {
  beforeEach(() => {
    push.mockClear()
    vi.stubGlobal('IntersectionObserver', OnScreen)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens with Funnels and sites in front, and turns through every build', () => {
    vi.useFakeTimers()
    installMatchMedia()
    renderCard()
    expect(front()).toBe('Funnels and sites')
    const seen = new Set([front()])
    for (let i = 0; i < BUILDS.length; i++) {
      act(() => vi.advanceTimersByTime(SPIN_MS))
      seen.add(front())
    }
    expect(seen.size).toBe(BUILDS.length)
  })

  it('a click on the fan opens the build in front on Projects', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    fireEvent.click(fan())
    expect(push).toHaveBeenCalledWith('/projects#sites', { scroll: false })
  })

  it('a click on the tile the pointer brought forward opens that one', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: -9999 })
    expect(front()).toBe(BUILDS[0].name)
    fireEvent.click(fan())
    expect(push).toHaveBeenCalledWith(`/projects#${BUILDS[0].view}`, { scroll: false })
  })

  it('a click anywhere else on the card opens the Projects page, as before', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    fireEvent.click(screen.getByRole('heading', { name: 'Projects' }))
    expect(push).toHaveBeenCalledWith('/projects', { scroll: false })
  })

  it('a Ctrl-click on the fan is left to the browser (the link opens Projects in a new tab)', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    const e = fireEvent.click(fan(), { ctrlKey: true })
    expect(e).toBe(true)
    expect(push).not.toHaveBeenCalled()
  })
})
