import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SiteCarousel from '@/components/projects/SiteCarousel'
import { projects } from '@/data/projects'

const sites = projects.sitesView.sites
const ring = () => document.querySelector<HTMLElement>('[data-carousel-ring]')!

describe('SiteCarousel (the Kraft spin ring)', () => {
  it('puts every site on the ring as a button, in order, each on its own face', () => {
    render(<SiteCarousel sites={sites} onOpen={() => {}} running={false} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(sites.map((s) => `Open ${s.name}`))
    const faces = [...document.querySelectorAll<HTMLElement>('[data-carousel-ring] > li')].map((li) => li.style.transform)
    expect(new Set(faces).size).toBe(sites.length)
    expect(faces[1].startsWith(`rotateY(${(360 / sites.length).toFixed(2)}deg) translateZ(`)).toBe(true)
  })

  it('opens a page on a click', () => {
    const onOpen = vi.fn()
    render(<SiteCarousel sites={sites} onOpen={onOpen} running={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Tidewell' }))
    expect(onOpen).toHaveBeenCalledWith(sites[1])
  })

  it('a drag that ends on a page spins the ring and does not open it', () => {
    const onOpen = vi.fn()
    render(<SiteCarousel sites={sites} onOpen={onOpen} running={false} />)
    const stage = ring().parentElement!
    const page = screen.getByRole('button', { name: 'Open Westmere' })
    fireEvent.pointerDown(stage, { clientX: 100, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 180, pointerId: 1 })
    fireEvent.pointerUp(window, { clientX: 180, pointerId: 1 })
    fireEvent.click(page)
    expect(onOpen).not.toHaveBeenCalled()
    expect(ring().style.transform).toMatch(/^rotateY\(22\.4\d*deg\)$/) // 80px × 0.28°
  })

  it('turns a page to the front when it takes keyboard focus', () => {
    render(<SiteCarousel sites={sites} onOpen={() => {}} running={false} />)
    screen.getByRole('button', { name: 'Open Ironline Utility Infrastructure' }).focus()
    const index = sites.findIndex((s) => s.name === 'Ironline Utility Infrastructure')
    expect(ring().style.transform).toBe(`rotateY(${(-index * (360 / sites.length)).toFixed(2)}deg)`)
  })
})
