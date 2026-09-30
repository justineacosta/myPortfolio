import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import { agentsView, DOCS } from '@/data/projectDocs'
import { BUILDS, DOC_VIEWS, PROJECT_VIEWS, projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

describe('Projects data', () => {
  it('names every sub-view once, and every write-up opens a document', () => {
    expect(new Set(PROJECT_VIEWS).size).toBe(PROJECT_VIEWS.length)
    expect(Object.keys(DOCS).sort()).toEqual([...DOC_VIEWS].sort())
    expect(projects.writeups.every((w) => w.page || (DOC_VIEWS as readonly string[]).includes(w.view))).toBe(true)
  })

  it("keeps Kraft's roster, the build plan's sections, the reel and the sites", () => {
    expect(agentsView.groups.map((g) => g.name)).toEqual(['KapeAI', 'AI Agents', 'RAG Chatbots', 'Chatbots', 'Hermes'])
    expect(projects.reel.shots.map((s) => s.label)).toEqual([
      'TM-01 · Quote request', 'Workflows list', 'TM-02 · Survey → Estimate', 'Workflow settings', 'Executions',
    ])
    expect(projects.reel.shots.every((s) => s.src.includes('n8n workflow screenshot'))).toBe(true)
    expect(projects.sitesView.sites).toHaveLength(8)
  })

  it('shows a real 16:10 screenshot of the build plan on Home', () => {
    const plan = BUILDS.find((b) => b.view === 'build-plan')!
    expect(plan.shot).toBe('/shots/build-plan.jpeg')
    expect(jpegSize(readFileSync(`public${plan.shot}`))).toEqual({ width: 640, height: 400 })
  })

  it('opens the End-to-End Workflow as its own page, with a real 16:10 screenshot on Home', () => {
    const w = projects.writeups.find((x) => x.view === 'end-to-end')!
    expect(w).toMatchObject({ page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', cue: 'READ THE WORKFLOW' })
    expect(DOC_VIEWS).toEqual(['agentic-framework'])
    const shot = BUILDS.find((b) => b.view === 'end-to-end')!.shot
    expect(shot).toBe('/shots/end-to-end.jpeg')
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

  it('has a tall screenshot of every sample page, at least three screens deep, for the card to peek through', () => {
    for (const s of projects.sitesView.sites) {
      expect(s.tall).toBe(`/samples/thumbs/tall/${s.file.replace(/\.html$/, '.jpeg')}`)
      const { width, height } = jpegSize(readFileSync(`public${s.tall}`))
      expect(width, s.tall).toBe(432)
      // 1080 x 1440 screens saved at 0.4x: three screens are 1728px.
      expect(height, s.tall).toBeGreaterThanOrEqual(1728)
    }
  })
})

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
  it('links every card to its sub-view by hash, in board order', () => {
    render(<Board />)
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#reel', '#build-plan', '#agentic-framework', '#end-to-end', '#sites', '#ai-agents',
    ])
    expect(screen.getByText('CLICK A CARD TO OPEN IT')).toBeInTheDocument()
  })

  it('shows the build plan card as an n8n plan', () => {
    render(<Board />)
    const card = screen.getByRole('link', { name: /^The build plan/ })
    expect(within(card).getByText('N8N BUILD PLAN')).toBeInTheDocument()
    expect(['Webhook', 'Claude', 'Approve?', 'Stripe'].every((s) => within(card).queryByText(s))).toBe(true)
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
    expect(document.body).toHaveTextContent('Write the spec first')
  })

  it('opens the write-up a shared link names, and Close drops the hash', () => {
    window.history.replaceState(null, '', '/projects#agentic-framework')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'The Agentic Framework' })
    expect(view).toHaveAttribute('open')
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

  it('marks which systems are live and which are internal', () => {
    window.history.replaceState(null, '', '/projects#ai-agents')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
    expect(within(view).getAllByText('LIVE')).toHaveLength(7)
    expect(within(view).getAllByText('INTERNAL')).toHaveLength(3)
  })
})
