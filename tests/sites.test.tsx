import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'
import { projects } from '@/data/projects'
import { applyPerfTier } from '@/lib/perf'
import { installMatchMedia, setMediaMatch } from '@/test/matchMedia'

vi.mock('@/components/projects/SiteDrum', () => ({
  default: ({ sites: list, onOpen, onFail, paused }: { sites: typeof sites; onOpen: (s: (typeof sites)[number]) => void; onFail: () => void; paused?: boolean }) => {
    // Stands in for a drum chunk that fails to load, or a drum that throws.
    if ((globalThis as { drumThrows?: boolean }).drumThrows) throw new Error('drum chunk failed')
    return (
    <div data-testid="drum" data-paused={String(!!paused)}>
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
const setDrumThrows = (v: boolean) => ((globalThis as { drumThrows?: boolean }).drumThrows = v)
/** The Kraft carousel: what a failed drum, and the closed view's pre-rendered HTML, show. */
const carousel = (view: HTMLElement) => view.querySelector<HTMLElement>('[data-carousel]')
const sites = projects.sitesView.sites
const answer = (status: number) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))

function openSites() {
  window.history.replaceState(null, '', '/projects#sites')
  render(<ProjectViews />)
  return screen.getByRole('dialog', { name: 'Funnels and sites' })
}

describe('Funnels and sites: the carousel and the preview', () => {
  // The drum can't run here, so the Kraft carousel stands in.
  beforeEach(() => {
    setDrumThrows(true)
    answer(200)
  })
  afterEach(() => {
    setDrumThrows(false)
    vi.unstubAllGlobals()
  })

  it('lists every sample site as a button, in order', async () => {
    const view = openSites()
    await within(view).findByRole('button', { name: 'Open Harbor & Pine Moving Co.' })
    const list = within(carousel(view)!).getByRole('list', { name: 'Sample sites' })
    expect(within(list).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(sites.map((s) => `Open ${s.name}`))
  })

  it('opens a site in the preview window, with the page and a new-tab link', async () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Oriel' }))
    const preview = screen.getByRole('dialog', { name: 'Oriel preview' })
    expect(preview).toHaveAttribute('open')
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', sites[0].src)
    const frame = await within(preview).findByTitle('Oriel')
    expect(frame).toHaveAttribute('src', sites[0].src)
    // A dropped-in client export may carry third-party scripts: they run, but not as the portfolio.
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts')
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin')
  })

  it('closing the preview goes back to the sites, with the page still locked', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Westmere' }))
    const preview = screen.getByRole('dialog', { name: 'Westmere preview' })
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    expect(preview).not.toHaveAttribute('open')
    expect(view).toHaveAttribute('open')
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('says where the file goes when the page is missing', async () => {
    answer(404)
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Meridian Werks' }))
    const preview = screen.getByRole('dialog', { name: 'Meridian Werks preview' })
    // Nothing loads until the page is known to exist: never a 404 inside the window.
    expect(within(preview).queryByTitle('Meridian Werks')).toBeNull()
    expect(await within(preview).findByText(sites.find((s) => s.name === 'Meridian Werks')!.file)).toBeInTheDocument()
    expect(preview.textContent).toContain('public/samples/')
    expect(preview.textContent).not.toContain('public/cases/')
    expect(within(preview).queryByTitle('Meridian Werks')).toBeNull()
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toBeInTheDocument()
  })

  it('leaving the sites view closes the preview on it too', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Ironline Utility Infrastructure' }))
    act(() => {
      window.history.replaceState(null, '', '/projects')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(view).not.toHaveAttribute('open')
    // A closed <dialog> has no role to query by, so find it by its label.
    expect(document.querySelector('dialog[aria-label="Ironline Utility Infrastructure preview"]')).not.toHaveAttribute('open')
  })
})

describe('Funnels and sites: the case-page tabs', () => {
  beforeEach(() => {
    setDrumThrows(true)
    answer(200)
  })
  afterEach(() => {
    setDrumThrows(false)
    vi.unstubAllGlobals()
  })
  const ORIEL = '/cases/oriel-portugal-residences'
  const openSite = (name: string) => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: `Open ${name}` }))
    return screen.getByRole('dialog', { name: `${name} preview` })
  }

  it('shows a tab row only for a site with case pages', () => {
    const preview = openSite('Oriel')
    const tabs = within(within(preview).getByRole('tablist', { name: 'Pages for this site' })).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Site', 'Automation', 'Build plan', 'Framework', 'End-to-end', 'AI agents'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Funnels and sites' })).getByRole('button', { name: 'Open Meridian Energy Infrastructure' }))
    expect(within(screen.getByRole('dialog', { name: 'Meridian Energy Infrastructure preview' })).queryByRole('tablist')).toBeNull()
  })

  it('a tab swaps the page, the address bar and the new-tab link', async () => {
    const preview = openSite('Oriel')
    fireEvent.click(within(preview).getByRole('tab', { name: 'Automation' }))
    const frame = await within(preview).findByTitle('Oriel · Automation')
    expect(frame).toHaveAttribute('src', `${ORIEL}/automation.html`)
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', `${ORIEL}/automation.html`)
    expect(preview.textContent).toContain(`${window.location.host}${ORIEL}/automation.html`)
  })

  it('keeps the site sandboxed and loads case pages unsandboxed', async () => {
    const preview = openSite('Oriel')
    const site = await within(preview).findByTitle('Oriel')
    expect(site.getAttribute('sandbox')).toContain('allow-scripts')
    expect(site.getAttribute('sandbox')).not.toContain('allow-same-origin')
    fireEvent.click(within(preview).getByRole('tab', { name: 'Automation' }))
    const page = await within(preview).findByTitle('Oriel · Automation')
    // Case pages mirror the portfolio’s theme from window.parent, which needs same-origin.
    expect(page).not.toHaveAttribute('sandbox')
  })

  it('says where a missing case page goes', async () => {
    answer(404)
    const preview = openSite('Oriel')
    fireEvent.click(within(preview).getByRole('tab', { name: 'AI agents' }))
    expect(await within(preview).findByText('ai-agents.html')).toBeInTheDocument()
    expect(preview.querySelector('iframe')).toBeNull()
    // Case pages live in public/cases/<site>/, never public/samples/.
    expect(preview.textContent).toContain('Upload ai-agents.html to public/cases/oriel-portugal-residences/ and this page opens live.')
    expect(preview.textContent).not.toContain('public/samples/')
  })

  it('starts on Site every time, and a site without cases shows no tabs after one with them', async () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Oriel' }))
    let preview = screen.getByRole('dialog', { name: 'Oriel preview' })
    fireEvent.click(within(preview).getByRole('tab', { name: 'AI agents' }))
    await within(preview).findByTitle('Oriel · AI agents')
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    fireEvent.click(within(view).getByRole('button', { name: 'Open Meridian Energy Infrastructure' }))
    preview = screen.getByRole('dialog', { name: 'Meridian Energy Infrastructure preview' })
    expect(within(preview).queryByRole('tablist')).toBeNull()
    expect(await within(preview).findByTitle('Meridian Energy Infrastructure')).toHaveAttribute('src', sites.find((s) => s.name === 'Meridian Energy Infrastructure')!.src)
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    fireEvent.click(within(view).getByRole('button', { name: 'Open Oriel' }))
    preview = screen.getByRole('dialog', { name: 'Oriel preview' })
    expect(within(preview).getByRole('tab', { name: 'Site' })).toHaveAttribute('aria-selected', 'true')
    expect(await within(preview).findByTitle('Oriel')).toHaveAttribute('src', sites[0].src)
  })

  it('starts on Site when the same site is closed and reopened', async () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Oriel' }))
    const preview = screen.getByRole('dialog', { name: 'Oriel preview' })
    fireEvent.click(within(preview).getByRole('tab', { name: 'Framework' }))
    await within(preview).findByTitle('Oriel · Framework')
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    fireEvent.click(within(view).getByRole('button', { name: 'Open Oriel' }))
    expect(within(preview).getByRole('tab', { name: 'Site' })).toHaveAttribute('aria-selected', 'true')
    expect(await within(preview).findByTitle('Oriel')).toHaveAttribute('src', sites[0].src)
    expect(within(preview).queryByTitle('Oriel · Framework')).toBeNull()
  })

  it('never shows a slow answer for a tab you have already left', async () => {
    const pending = new Map<string, (status: number) => void>()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => new Promise<Response>((resolve) => pending.set(url, (status) => resolve(new Response(null, { status }))))),
    )
    const preview = openSite('Oriel')
    fireEvent.click(within(preview).getByRole('tab', { name: 'Automation' }))
    fireEvent.click(within(preview).getByRole('tab', { name: 'Build plan' }))
    // Automation's check comes back missing after the visitor has moved on to Build plan.
    await act(async () => pending.get(`${ORIEL}/automation.html`)!(404))
    expect(within(preview).queryByText('automation.html')).toBeNull()
    expect(within(preview).queryByText('build-plan.html')).toBeNull()
    expect(preview.querySelector('iframe')).toBeNull()
    await act(async () => pending.get(`${ORIEL}/build-plan.html`)!(200))
    expect(await within(preview).findByTitle('Oriel · Build plan')).toHaveAttribute('src', `${ORIEL}/build-plan.html`)
    expect(within(preview).queryByText('automation.html')).toBeNull()
  })

  it('moves between tabs with the arrow keys', () => {
    const preview = openSite('Oriel')
    const site = within(preview).getByRole('tab', { name: 'Site' })
    site.focus()
    fireEvent.keyDown(site, { key: 'ArrowRight' })
    const automation = within(preview).getByRole('tab', { name: 'Automation' })
    expect(automation).toHaveFocus()
    expect(automation).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(automation, { key: 'ArrowLeft' })
    expect(site).toHaveFocus()
    fireEvent.keyDown(site, { key: 'ArrowLeft' })
    const last = within(preview).getByRole('tab', { name: 'AI agents' })
    expect(last).toHaveFocus()
    expect(last).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(last, { key: 'Home' })
    expect(site).toHaveFocus()
    fireEvent.keyDown(site, { key: 'End' })
    expect(last).toHaveFocus()
  })
})

describe('Funnels and sites: the drum', () => {
  beforeEach(() => answer(200))
  afterEach(() => vi.unstubAllGlobals())

  it('spins up the drum, and a pick opens the preview', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum pick'))
    expect(screen.getByRole('dialog', { name: 'Oriel preview' })).toHaveAttribute('open')
    expect(carousel(view)).toBeNull()
  })

  it('shows the drum on touch screens too', async () => {
    installMatchMedia(TOUCH)
    const view = openSites()
    expect(await within(view).findByTestId('drum')).toBeInTheDocument()
  })

  it('shows the drum with reduced motion on, and keeps it when the OS turns it on mid-visit', async () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const view = openSites()
    await within(view).findByTestId('drum')
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', false))
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    expect(within(view).getByTestId('drum')).toBeInTheDocument()
  })

  it('shows the drum at the low perf tier too', async () => {
    act(() => applyPerfTier('low'))
    const view = openSites()
    expect(await within(view).findByTestId('drum')).toBeInTheDocument()
  })

  it('falls back to the Kraft carousel when WebGL fails', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum fail'))
    expect(carousel(view)).toBeInTheDocument()
    expect(within(view).queryByTestId('drum')).toBeNull()
  })

  it('falls back to the Kraft carousel when the drum fails to load or throws, and a page there opens the preview', async () => {
    setDrumThrows(true)
    try {
      const view = openSites()
      await within(view).findByRole('button', { name: 'Open Harbor & Pine Moving Co.' })
      expect(carousel(view)).toBeInTheDocument()
      fireEvent.click(within(carousel(view)!).getByRole('button', { name: 'Open Harbor & Pine Moving Co.' }))
      expect(screen.getByRole('dialog', { name: 'Harbor & Pine Moving Co. preview' })).toHaveAttribute('open')
    } finally {
      setDrumThrows(false)
    }
  })

  it('pauses the drum while a preview covers it, and resumes when it closes', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum pick'))
    expect(within(view).getByTestId('drum')).toHaveAttribute('data-paused', 'true')
    const preview = screen.getByRole('dialog', { name: 'Oriel preview' })
    fireEvent.click(within(preview).getByRole('button', { name: projects.sitesView.preview.close }))
    expect(within(view).getByTestId('drum')).toHaveAttribute('data-paused', 'false')
  })

  it("keeps the carousel's sites in the page while the view is closed, and never a grid", () => {
    window.history.replaceState(null, '', '/projects')
    render(<ProjectViews />)
    // A closed <dialog> has no role to query by, so find it by its label.
    const view = document.querySelector('dialog[aria-label="Funnels and sites"]') as HTMLElement
    expect(carousel(view)?.querySelectorAll('button')).toHaveLength(sites.length)
    expect(view.querySelector('[data-site-grid]')).toBeNull()
  })
})
