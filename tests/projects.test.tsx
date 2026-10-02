import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import { BUILDS, PROJECT_VIEWS, projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

describe('Projects data', () => {
  it('names every sub-view once, and every write-up opens its own page', () => {
    expect(new Set(PROJECT_VIEWS).size).toBe(PROJECT_VIEWS.length)
    expect(projects.writeups.every((w) => w.page && w.frameTitle && w.shot)).toBe(true)
  })

  it('keeps the sites, and the Automations card opens its flows page, with a real 16:10 screenshot on Home', () => {
    expect(projects.sitesView.sites.map((s) => s.name)).toEqual([
      'Harbor & Pine Moving Co.', 'Westmere', 'Ironline Utility Infrastructure', 'Meridian Werks', 'Meridian Energy Infrastructure',
    ])
    expect('reel' in projects).toBe(false)
    expect(projects.cards.automations).toMatchObject({ page: '/automations.html', frameTitle: 'Automations flows page', cue: 'VIEW THE FLOWS', cta: 'OPEN THE FLOWS' })
    const shot = BUILDS.find((b) => b.view === 'automations')!.shot
    expect(shot).toBe('/shots/automations.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })

  it('shows a real 16:10 screenshot of the build plan on Home', () => {
    const plan = BUILDS.find((b) => b.view === 'build-plan')!
    expect(plan.shot).toBe('/shots/build-plan.jpeg')
    expect(jpegSize(readFileSync(`public${plan.shot}`))).toEqual({ width: 640, height: 400 })
  })

  it('opens the End-to-End Workflow as its own page, with a real 16:10 screenshot on Home', () => {
    const w = projects.writeups.find((x) => x.view === 'end-to-end')!
    expect(w).toMatchObject({ page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', cue: 'READ THE WORKFLOW' })
    const shot = BUILDS.find((b) => b.view === 'end-to-end')!.shot
    expect(shot).toBe('/shots/end-to-end.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })

  it('opens the Agentic Framework as its own page, with a real 16:10 screenshot on Home', () => {
    const w = projects.writeups.find((x) => x.view === 'agentic-framework')!
    expect(w).toMatchObject({ page: '/agentic-framework.html', frameTitle: 'Agentic Framework page', cue: 'READ THE FRAMEWORK' })
    const shot = BUILDS.find((b) => b.view === 'agentic-framework')!.shot
    expect(shot).toBe('/shots/agentic-framework.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })

  it('has a page and a thumbnail on disk for every sample site', () => {
    for (const s of projects.sitesView.sites) {
      expect(s.src).toBe(`/samples/${s.file}`)
      expect(s.thumb).toBe(`/samples/thumbs/${s.file.replace(/\.html$/, '.jpeg')}`)
      expect(existsSync(`public${s.src}`), s.src).toBe(true)
      expect(existsSync(`public${s.thumb}`), s.thumb).toBe(true)
    }
  })

  it('gives every board card at least three brand logos, each a file on disk', () => {
    const c = projects.cards
    const sets = [c.automations, c.plan, ...projects.writeups, c.sites, c.agents].map((x) => x.logos.map((l) => l.slug))
    expect(sets).toEqual(CARD_LOGOS)
    for (const slug of sets.flat()) expect(existsSync(`public/icons/brands/${slug}.svg`), slug).toBe(true)
  })

  it('puts a logo on every build plan step, the count chips and the preview run, each a file on disk', () => {
    const c = projects.cards
    expect(c.plan.steps.map((s) => [s.label, s.logo])).toEqual([['Webhook', 'n8n'], ['Claude', 'claude'], ['Approve?', 'telegram'], ['Stripe', 'stripe']])
    expect(c.agents.counts.map((x) => x.logo)).toEqual(['supabase', 'claude'])
    expect(c.agents.preview.runLogo).toBe('stripe')
    for (const slug of [...c.plan.steps.map((s) => s.logo), ...c.agents.counts.map((x) => x.logo)])
      expect(existsSync(`public/icons/brands/${slug}.svg`), slug).toBe(true)
  })

  it('has a tall screenshot of every sample page, at least three screens deep, for the card to peek through', () => {
    for (const s of projects.sitesView.sites) {
      expect(s.tall).toBe(`/samples/thumbs/tall/${s.file.replace(/\.html$/, '.jpeg')}`)
      const { width, height } = jpegSize(readFileSync(`public${s.tall}`))
      expect(width, s.tall).toBe(648)
      // 1080 x 1440 screens saved at 0.6x: three screens are 2592px.
      expect(height, s.tall).toBeGreaterThanOrEqual(2592)
    }
  })
})

/** Each board card's logos, in board order: automations, plan, framework, end-to-end, sites, agents. */
const CARD_LOGOS = [
  ['n8n', 'make', 'zapier'],
  ['n8n', 'claude', 'stripe'],
  ['claude', 'cursor', 'codex'],
  ['n8n', 'telegram', 'githubactions'],
  ['figma', 'react', 'tailwindcss'],
  ['claude', 'supabase', 'n8n'],
]
const srcs = (el: Element) => [...el.querySelectorAll('img')].map((i) => i.getAttribute('src')!)
const slugOf = (src: string) => decodeURIComponent(src).match(/brands\/([a-z0-9]+)\.svg/)?.[1]

/** A JPEG's pixel size, from its start-of-frame marker. */
function jpegSize(b: Buffer) {
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const m = b[i + 1]
    if (m >= 0xc0 && m <= 0xc3) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }
    i += 2 + b.readUInt16BE(i + 2)
  }
  throw new Error('no JPEG frame')
}

describe('Board', () => {
  it('says what the Automations card holds', () => {
    render(<Board />)
    const card = screen.getByRole('link', { name: /^Automations/ })
    expect(card).toHaveAttribute('href', '#automations')
    expect(within(card).getByText('The flows behind my sample sites’ forms, on n8n, Make and Zapier.')).toBeInTheDocument()
    expect(within(card).getByText(/OPEN THE FLOWS/)).toBeInTheDocument()
    expect(within(card).queryByText('Workflow screen')).toBeNull()
    expect(card.querySelector('[data-flow-peek]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('links every card to its sub-view by hash, in board order', () => {
    render(<Board />)
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#automations', '#build-plan', '#agentic-framework', '#end-to-end', '#sites', '#ai-agents',
    ])
    expect(screen.getByText('CLICK A CARD TO OPEN IT')).toBeInTheDocument()
  })

  it('shows the build plan card as an n8n plan, each step with its tool’s logo', () => {
    render(<Board />)
    const card = screen.getByRole('link', { name: /^The build plan/ })
    expect(within(card).getByText('N8N BUILD PLAN')).toBeInTheDocument()
    const steps = ['Webhook', 'Claude', 'Approve?', 'Stripe'].map((s) => within(card).getByText(s).closest('span')!)
    expect(steps.map((s) => srcs(s).map(slugOf))).toEqual([['n8n'], ['claude'], ['telegram'], ['stripe']])
  })

  it('tops every card with an overlapping stack of its brand logos, decoration only, and no green icon', () => {
    render(<Board />)
    const stacks = screen.getAllByRole('link').map((a) => a.querySelector('[data-logo-stack]')!)
    expect(stacks.map((s) => srcs(s).map(slugOf))).toEqual(CARD_LOGOS)
    for (const s of stacks) {
      expect(s).toHaveAttribute('aria-hidden', 'true')
      expect(s.querySelector('svg')).toBeNull()
      for (const img of s.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
    }
  })

  it('names the card under the pointer in the cursor cue', () => {
    render(<Board />)
    fireEvent.pointerMove(screen.getByRole('link', { name: /^The build plan/ }), { clientX: 40, clientY: 40 })
    expect(screen.getByText('VIEW THE PLAN')).toBeInTheDocument()
  })

  it('a plain click opens the view through history.pushState, so Next can find the entry again', () => {
    window.history.replaceState(null, '', '/projects')
    const spy = vi.spyOn(window.history, 'pushState')
    render(<Board />)
    fireEvent.click(screen.getByRole('link', { name: /^The build plan/ }))
    expect(spy).toHaveBeenCalledWith(null, '', '#build-plan')
    spy.mockRestore()
  })

  it('a modified click is left to the browser (new tab, new window)', () => {
    const spy = vi.spyOn(window.history, 'pushState')
    render(<Board />)
    fireEvent.click(screen.getByRole('link', { name: /^The build plan/ }), { ctrlKey: true })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('shows no cue with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Board />)
    fireEvent.pointerMove(screen.getByRole('link', { name: /^The build plan/ }), { clientX: 40, clientY: 40 })
    expect(screen.queryByText('VIEW THE PLAN')).toBeNull()
  })
})

describe('ProjectViews', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))

  it('pre-renders every view, closed', () => {
    render(<ProjectViews />)
    const dialogs = document.querySelectorAll('dialog')
    // Every sub-view, plus the site preview that stacks on the sites view.
    expect(dialogs).toHaveLength(PROJECT_VIEWS.length + 1)
    dialogs.forEach((d) => expect(d).not.toHaveAttribute('open'))
    // A page view's window shows its address even while closed; its page loads only once open.
    expect(document.body).toHaveTextContent('/ai-agents.html')
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('opens the write-up a shared link names, as its page in the window, and Close drops the hash', () => {
    window.history.replaceState(null, '', '/projects#agentic-framework')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'The Agentic Framework' })
    expect(view).toHaveAttribute('open')
    expect(within(view).getByTitle('Agentic Framework page')).toHaveAttribute('src', '/agentic-framework.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/agentic-framework.html')
    fireEvent.click(within(view).getByRole('button', { name: 'Close' }))
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })

  it('has no iframe while the build plan is closed, so /projects never fetches it up front', () => {
    render(<ProjectViews />)
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('shows the build plan page in its window, with a way out to a new tab and Close focused', () => {
    window.history.replaceState(null, '', '/projects#build-plan')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'The build plan' })
    expect(view).toHaveAttribute('open')
    const frame = within(view).getByTitle('Trusted Mover build plan')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/build-plan.html')
    const out = within(view).getByRole('link', { name: 'Open in new tab' })
    expect(out).toHaveAttribute('href', '/build-plan.html')
    expect(out).toHaveAttribute('target', '_blank')
    expect(within(view).getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('has no Support Ticketing write-up and no Workflow Creator any more', () => {
    render(<ProjectViews />)
    expect(document.body).not.toHaveTextContent('Support Ticketing System')
    expect(document.body).not.toHaveTextContent('Workflow Creator')
  })

  it('opens the Automations page in its window, with a new-tab link', () => {
    window.history.replaceState(null, '', '/projects#automations')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Automations' })
    const frame = within(view).getByTitle('Automations flows page')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/automations.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/automations.html')
  })

  it('opens the AI agents page in its window, with a new-tab link', () => {
    window.history.replaceState(null, '', '/projects#ai-agents')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
    const frame = within(view).getByTitle('AI agents and RAG chatbots page')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/ai-agents.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/ai-agents.html')
  })

  it('shows a real 16:10 screenshot of the AI agents page on Home', () => {
    const shot = BUILDS.find((b) => b.view === 'ai-agents')!.shot
    expect(shot).toBe('/shots/ai-agents.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })
})

describe('the AI agents card', () => {
  const card = () => {
    render(<Board />)
    return screen.getByRole('link', { name: /^AI agents and RAG chatbots/ })
  }

  it('says what is inside, counted from the page’s own builds', async () => {
    const { agents } = await import('@/data/agents')
    const c = card()
    expect(c).toHaveAttribute('href', '#ai-agents')
    expect(within(c).getByText('Sample RAG chatbots and agents, and how each one works.')).toBeInTheDocument()
    const rag = agents.builds.filter((b) => b.kind === 'rag').length
    const agent = agents.builds.filter((b) => b.kind === 'agent').length
    expect(projects.cards.agents.counts.map((x) => x.name)).toEqual([`${rag} RAG chatbots`, `${agent} AI agents`])
    for (const x of projects.cards.agents.counts) expect(within(c).getByText(x.name)).toBeInTheDocument()
    expect(projects.cards.agents.counts.map((x) => srcs(within(c).getByText(x.name)).map(slugOf))).toEqual([['supabase'], ['claude']])
    expect(within(c).getByText('SEE HOW THEY WORK')).toBeInTheDocument()
  })

  it('shows the eight tool logos as decoration, and no live dots', () => {
    const c = card()
    const logos = [...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    for (const slug of ['claude', 'n8n', 'supabase', 'gmail', 'googlesheets', 'telegram', 'stripe', 'caldotcom'])
      expect(logos.some((s) => s?.includes(`${slug}.svg`)), slug).toBe(true)
    for (const img of c.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
    for (const slug of ['gmail', 'telegram', 'caldotcom']) expect(existsSync(`public/icons/brands/${slug}.svg`), slug).toBe(true)
    expect(c.querySelector('.size-1\\.5.rounded-full.bg-accent')).toBeNull()
  })

  it('plays a preview that screen readers skip and nothing in it can take focus', () => {
    const c = card()
    const p = c.querySelector('.agents-preview')!
    expect(p).toHaveAttribute('aria-hidden', 'true')
    // The same two scenarios the page's Harbor & Pine builds show.
    expect(p.textContent).toContain('Do you move pianos, and what does it add?')
    expect(p.textContent).toContain('Pricing guide §4')
    expect(p.textContent).toContain('Stripe · invoice 14 days overdue')
    expect(srcs(p.querySelector('.ap-step-1')!).map(slugOf)).toEqual(['stripe'])
    expect(p.querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('keeps no kape names', () => {
    expect(card().textContent).not.toMatch(/kape|brewedops/i)
  })
})
