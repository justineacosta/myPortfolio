import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import CertBadge from '@/components/ui/CertBadge'

describe('CertBadge (kapeportfolio badge.svg, in Kraft colours)', () => {
  it("draws badge.svg's medallion, dashed ring and ribbon, with the logo inside", () => {
    const { container } = render(<CertBadge icon="/assets/aws-mark.svg" size={72} />)
    const badge = container.querySelector('[data-cert-badge]')!
    expect(badge).toHaveAttribute('aria-hidden', 'true')
    expect(badge.querySelector('circle[data-cert-ring]')).toHaveAttribute('r', '32')
    expect(badge.querySelector('circle[data-cert-dashes]')).toHaveAttribute('stroke-dasharray', '4 4')
    expect(badge.querySelector('path[data-cert-ribbon]')).toHaveAttribute('d', 'M34 60 26 90l22-10 22 10-8-30z')
    expect(badge.querySelector('img')?.getAttribute('src')).toContain('aws-mark.svg')
  })

  it('sizes the medallion to `size`, the drawing scaled around it', () => {
    const { container } = render(<CertBadge icon="/assets/aws-mark.svg" size={64} />)
    const badge = container.querySelector<HTMLElement>('[data-cert-badge]')!
    expect(badge.style.width).toBe('64px')
    expect(badge.querySelector('svg')).toHaveAttribute('width', '96')
  })

  it('uses its own ribbon gradient per badge, so two badges never share an id', () => {
    const { container } = render(
      <>
        <CertBadge icon="/a.svg" size={40} />
        <CertBadge icon="/b.svg" size={40} />
      </>,
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
    expect(new Set(ids).size).toBe(2)
    for (const ribbon of container.querySelectorAll('[data-cert-ribbon]')) {
      expect(ids.map((id) => `url(#${id})`)).toContain(ribbon.getAttribute('fill'))
    }
  })
})
