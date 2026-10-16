import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import AboutPage from '@/app/(site)/about/page'
import { about, ROLES } from '@/data/about'
import { brandIcon } from '@/data/stack'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'

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

  it('labels the medals row Courses', () => {
    render(<AboutPage />)
    expect(screen.getByText('COURSES')).toBeInTheDocument()
    expect(screen.queryByText('BADGES')).not.toBeInTheDocument()
    expect(screen.queryByText('CERTIFIED')).not.toBeInTheDocument()
  })

  it('shows each certification as a small badge.svg medal', () => {
    render(<AboutPage />)
    for (const name of ['AWS Cloud Practitioner Essentials', 'HackerRank Software Engineer']) {
      const badge = screen.getByRole('img', { name }).querySelector<HTMLElement>('[data-cert-badge]')
      expect(badge?.style.width).toBe('40px')
    }
  })

  it('shows the workstation and where Justine is based', () => {
    render(<AboutPage />)
    expect(screen.getByRole('img', { name: about.image.alt })).toBeInTheDocument()
    expect(screen.getByText('Based in Manila, Philippines')).toBeInTheDocument()
    expect(screen.getByText('GMT+8 · US / EU / CA OVERLAP')).toBeInTheDocument()
  })

  it('plays the workstation as a looping video, and swaps it for a still frame when motion is off', () => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as unknown as HTMLMediaElement['play']
    render(<AboutPage />)
    expect(screen.getByRole('img', { name: about.image.alt }).querySelector('source[type="video/mp4"]')).toHaveAttribute('src', about.image.mp4)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(screen.getByRole('img', { name: about.image.alt }).getAttribute('src')).toContain(about.image.still)
  })

  it('has a self-hosted logo for every role', () => {
    const missing = ROLES.flatMap((r) => r.logos).filter((l) => !existsSync(`public${brandIcon(l.slug)}`))
    expect(missing).toEqual([])
  })
})
