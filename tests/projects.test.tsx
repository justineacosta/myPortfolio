import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import { agentsView, DOCS } from '@/data/projectDocs'
import { DOC_VIEWS, PROJECT_VIEWS, projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

describe('Projects data', () => {
  it('names every sub-view once, and every write-up opens a document', () => {
    expect(new Set(PROJECT_VIEWS).size).toBe(PROJECT_VIEWS.length)
    expect(Object.keys(DOCS).sort()).toEqual([...DOC_VIEWS].sort())
    expect(projects.writeups.every((w) => (DOC_VIEWS as readonly string[]).includes(w.view))).toBe(true)
  })

  it("keeps Kraft's roster, the build plan's sections, the reel and the sites", () => {
    expect(agentsView.groups.map((g) => g.name)).toEqual(['KapeAI', 'AI Agents', 'RAG Chatbots', 'Chatbots', 'Hermes'])
    expect(DOCS['build-plan'].sections.map((s) => s.name)).toEqual([
      'Before anything is clicked', 'The flow', 'What ships with it',
    ])
    expect(projects.reel.shots.map((s) => s.label)).toEqual([
      '01 - Support | New Ticket', 'Workflows list', '02 - Post-Purchase Delivery', 'Global workflow settings', 'Execution logs',
    ])
    expect(projects.sitesView.sites).toHaveLength(8)
  })

  it('has a page and a thumbnail on disk for every sample site', () => {
    for (const s of projects.sitesView.sites) {
      expect(s.src).toBe(`/samples/${s.file}`)
      expect(s.thumb).toBe(`/samples/thumbs/${s.file.replace(/\.html$/, '.jpeg')}`)
      expect(existsSync(`public${s.src}`), s.src).toBe(true)
      expect(existsSync(`public${s.thumb}`), s.thumb).toBe(true)
    }
  })
})

describe('Board', () => {
  it('links every card to its sub-view by hash, in board order', () => {
    render(<Board />)
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#reel', '#build-plan', '#support-desk', '#agentic-framework', '#end-to-end', '#sites', '#ai-agents',
    ])
    expect(screen.getByText('CLICK A CARD TO OPEN IT')).toBeInTheDocument()
  })

  it('names the card under the pointer in the cursor cue', () => {
    render(<Board />)
    fireEvent.pointerMove(screen.getByRole('link', { name: /^The build plan/ }), { clientX: 40, clientY: 40 })
    expect(screen.getByText('VIEW THE PLAN')).toBeInTheDocument()
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
    expect(dialogs).toHaveLength(PROJECT_VIEWS.length)
    dialogs.forEach((d) => expect(d).not.toHaveAttribute('open'))
    expect(document.body).toHaveTextContent('Name the outcome')
  })

  it('opens the write-up a shared link names, and Close drops the hash', () => {
    window.history.replaceState(null, '', '/projects#support-desk')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Support Ticketing System' })
    expect(view).toHaveAttribute('open')
    fireEvent.click(within(view).getByRole('button', { name: 'Close' }))
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })

  it('marks which systems are live and which are internal', () => {
    window.history.replaceState(null, '', '/projects#ai-agents')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
    expect(within(view).getAllByText('LIVE')).toHaveLength(8)
    expect(within(view).getAllByText('INTERNAL')).toHaveLength(3)
  })
})
