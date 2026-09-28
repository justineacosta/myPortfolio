import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'
import { projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

vi.mock('@/components/projects/SiteDrum', () => ({
  default: ({ sites: list, onOpen, onFail }: { sites: typeof sites; onOpen: (s: (typeof sites)[number]) => void; onFail: () => void }) => {
    // Stands in for a drum chunk that fails to load, or a drum that throws.
    if ((globalThis as { drumThrows?: boolean }).drumThrows) throw new Error('drum chunk failed')
    return (
    <div data-testid="drum">
      <button type="button" onClick={() => onOpen(list[0])}>
        drum pick
      </button>
      <button type="button" onClick={onFail}>
        drum fail
      </button>
    </div>
    )
  },
}))

const TOUCH = { '(pointer: coarse) and (hover: none)': true }
const sites = projects.sitesView.sites
const answer = (status: number) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))

function openSites() {
  window.history.replaceState(null, '', '/projects#sites')
  render(<ProjectViews />)
  return screen.getByRole('dialog', { name: 'Funnels and sites' })
}

describe('Funnels and sites: the grid and the preview', () => {
  beforeEach(() => {
    installMatchMedia(TOUCH)
    answer(200)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists every sample site as a button, in order', () => {
    const view = openSites()
    const list = within(view).getByRole('list', { name: 'Sample sites' })
    expect(within(list).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(sites.map((s) => `Open ${s.name}`))
  })

  it('opens a site in the preview window, with the page and a new-tab link', async () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Apex Build Co.' }))
    const preview = screen.getByRole('dialog', { name: 'Apex Build Co. preview' })
    expect(preview).toHaveAttribute('open')
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', sites[0].src)
    const frame = await within(preview).findByTitle('Apex Build Co.')
    expect(frame).toHaveAttribute('src', sites[0].src)
    // A dropped-in client export may carry third-party scripts: they run, but not as the portfolio.
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts')
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin')
  })

  it('closing the preview goes back to the sites, with the page still locked', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Blade Studio' }))
    const preview = screen.getByRole('dialog', { name: 'Blade Studio preview' })
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    expect(preview).not.toHaveAttribute('open')
    expect(view).toHaveAttribute('open')
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('says where the file goes when the page is missing', async () => {
    answer(404)
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Payline' }))
    const preview = screen.getByRole('dialog', { name: 'Payline preview' })
    // Nothing loads until the page is known to exist: never a 404 inside the window.
    expect(within(preview).queryByTitle('Payline')).toBeNull()
    expect(await within(preview).findByText(sites[6].file)).toBeInTheDocument()
    expect(within(preview).queryByTitle('Payline')).toBeNull()
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toBeInTheDocument()
  })

  it('leaving the sites view closes the preview on it too', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Baptiste' }))
    act(() => {
      window.history.replaceState(null, '', '/projects')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(view).not.toHaveAttribute('open')
    // A closed <dialog> has no role to query by, so find it by its label.
    expect(document.querySelector('dialog[aria-label="Baptiste preview"]')).not.toHaveAttribute('open')
  })
})

describe('Funnels and sites: the drum', () => {
  beforeEach(() => answer(200))
  afterEach(() => vi.unstubAllGlobals())

  it('spins up the drum where WebGL is allowed, and a pick opens the preview', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum pick'))
    expect(screen.getByRole('dialog', { name: 'Apex Build Co. preview' })).toHaveAttribute('open')
    expect(within(view).queryByRole('list', { name: 'Sample sites' })).toBeNull()
  })

  it('falls back to the grid when WebGL fails', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum fail'))
    expect(within(view).getByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
    expect(within(view).queryByTestId('drum')).toBeNull()
  })

  it('falls back to the grid when the drum fails to load or throws', async () => {
    ;(globalThis as { drumThrows?: boolean }).drumThrows = true
    try {
      const view = openSites()
      expect(await within(view).findByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
      fireEvent.click(within(view).getByRole('button', { name: 'Open Apex Build Co.' }))
      expect(screen.getByRole('dialog', { name: 'Apex Build Co. preview' })).toHaveAttribute('open')
    } finally {
      ;(globalThis as { drumThrows?: boolean }).drumThrows = false
    }
  })

  it('never loads the drum with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const view = openSites()
    expect(within(view).queryByTestId('drum')).toBeNull()
    expect(within(view).getByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
  })

  it('keeps the grid in the page while the view is closed', () => {
    window.history.replaceState(null, '', '/projects')
    render(<ProjectViews />)
    // A closed <dialog> has no role to query by, so find it by its label.
    const view = document.querySelector('dialog[aria-label="Funnels and sites"]') as HTMLElement
    expect(view.querySelector('ul[aria-label="Sample sites"]')).toBeInTheDocument()
  })
})
