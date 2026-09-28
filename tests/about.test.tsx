import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from '@/app/(site)/about/page'
import { about, ROLES } from '@/data/about'
import { brandIcon } from '@/data/stack'

describe('About', () => {
  it("is Kraft's About: the greeting, the parts nobody demos, and four roles", () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: "Hi, I'm Justine." })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /^I care about the parts nobody demos\./ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Full Stack Developer', 'AI Automation Engineer', 'AI Web Dev', 'Systems Builder',
    ])
  })

  it('names both certifications, and each can take keyboard focus to show its tooltip', () => {
    render(<AboutPage />)
    for (const name of ['AWS Cloud Practitioner Essentials', 'HackerRank Software Engineer']) {
      expect(screen.getByRole('img', { name })).toHaveAttribute('tabindex', '0')
    }
  })

  it('shows the workstation and where Justine is based', () => {
    render(<AboutPage />)
    expect(screen.getByRole('img', { name: about.image.alt })).toBeInTheDocument()
    expect(screen.getByText('Based in Manila, Philippines')).toBeInTheDocument()
    expect(screen.getByText('GMT+8 · US / EU / CA OVERLAP')).toBeInTheDocument()
  })

  it('has a self-hosted logo for every role', () => {
    const missing = ROLES.flatMap((r) => r.logos).filter((l) => !existsSync(`public${brandIcon(l.slug)}`))
    expect(missing).toEqual([])
  })
})
