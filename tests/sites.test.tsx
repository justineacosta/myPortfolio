import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'
import { projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

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
    expect(within(preview).getByTitle('Apex Build Co.')).toHaveAttribute('src', sites[0].src)
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', sites[0].src)
    await act(async () => {})
    expect(within(preview).getByTitle('Apex Build Co.')).toBeInTheDocument()
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
