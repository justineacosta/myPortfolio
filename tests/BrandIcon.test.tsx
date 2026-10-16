import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BrandIcon from '@/components/ui/BrandIcon'

describe('BrandIcon (one sprite for every logo)', () => {
  it('draws the logo from the sprite, decorative by default', () => {
    const { container } = render(<BrandIcon slug="n8n" size={15} className="block" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '15')
    expect(svg.querySelector('use')).toHaveAttribute('href', '/icons/brands.svg#n8n')
  })

  it('names the logo when given an alt', () => {
    render(<BrandIcon slug="postgresql" size={17} alt="PostgreSQL" />)
    expect(screen.getByRole('img', { name: 'PostgreSQL' })).toBeInTheDocument()
  })

  it('has a symbol in the sprite for every logo file (re-run node scripts/brand-icons.mjs)', () => {
    const sprite = readFileSync('public/icons/brands.svg', 'utf8')
    for (const file of readdirSync('public/icons/brands')) expect(sprite, file).toContain(`<symbol id="${file.replace(/\.svg$/, '')}"`)
  })
})
