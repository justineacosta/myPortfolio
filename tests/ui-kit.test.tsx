import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import Shot from '@/components/ui/Shot'

describe('PageHeader', () => {
  it("shows the page's crumb, Kraft's two-line heading as one sentence, and the lede", () => {
    render(<PageHeader href="/projects" title={['Real builds you', 'can open.']} lede="Everything here shipped." />)
    expect(screen.getByText('PROJECTS / BUILDS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Real builds you can open.' })).toBeInTheDocument()
    expect(screen.getByText('Everything here shipped.')).toBeInTheDocument()
  })
})

describe('Frame', () => {
  it('lights the frame from the given edge, defaulting to the top and the s1 surface', () => {
    const { container } = render(
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="p-4">
        <span>inside</span>
      </Frame>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el).toHaveClass('frame', 'p-4')
    expect(el.style.getPropertyValue('--lit-x')).toBe('12%')
    expect(el.style.getPropertyValue('--lit-y')).toBe('-10%')
    expect(el.style.getPropertyValue('--lit-size')).toBe('110% 100%')
    expect(el.style.getPropertyValue('--lit-from')).toBe('var(--s1)')
  })
})

describe('Shot', () => {
  it("shows Kraft's empty slot while the screenshot is a PLACEHOLDER", () => {
    render(
      <div className="relative">
        <Shot src="PLACEHOLDER - workflow screenshot" hint="Drop a workflow screenshot · 16:10" />
      </div>,
    )
    expect(screen.getByText('Drop a workflow screenshot · 16:10')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows the image once there is one', () => {
    render(
      <div className="relative">
        <Shot src="/assets/portrait.jpg" hint="unused" alt="A real screenshot" />
      </div>,
    )
    expect(screen.getByRole('img', { name: 'A real screenshot' })).toBeInTheDocument()
  })
})
