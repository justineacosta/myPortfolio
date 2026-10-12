import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatEmbed from '@/components/chat/ChatEmbed'
import { chat } from '@/data/chat'
import { EMBED_MESSAGE, EMBED_SCRIPT, withLumen } from '@/lib/chat/embed'
import { pageFor } from '@/lib/chat/pages'
import { startersFor } from '@/lib/chat/suggestions'
import { localAnswer } from '@/lib/chat/local'
import { CASE_PAGES, CASE_SITES, casePath } from '@/data/cases/pages'
import { projects } from '@/data/projects'

const PUBLIC = join(process.cwd(), 'public')
const WRITEUPS = [projects.cards.automations.page, projects.cards.plan.page, projects.cards.agents.page, ...projects.writeups.map((w) => w.page)]
const CASE_FILES = CASE_SITES.flatMap((key) => readdirSync(join(PUBLIC, 'cases', key)).map((f) => `/cases/${key}/${f}`))

describe('Lumen on the case-study and write-up pages', () => {
  it('puts the launcher on every case page and write-up, once, and leaves the sample sites alone', () => {
    for (const path of [...CASE_FILES, ...WRITEUPS]) {
      const html = readFileSync(join(PUBLIC, path), 'utf8')
      expect(html.split(EMBED_SCRIPT).length - 1, path).toBe(1)
    }
    for (const f of readdirSync(join(PUBLIC, 'samples')).filter((f) => f.endsWith('.html'))) {
      expect(readFileSync(join(PUBLIC, 'samples', f), 'utf8'), f).not.toContain(EMBED_SCRIPT)
    }
  })

  it('adds the tag before </body>, once, however often a page is written', () => {
    const page = '<html><body><p>Hi</p></body></html>'
    expect(withLumen(page)).toBe(`<html><body><p>Hi</p>${EMBED_SCRIPT}</body></html>`)
    expect(withLumen(withLumen(page))).toBe(withLumen(page))
  })

  it('knows every case page and write-up, with the sample it belongs to', () => {
    for (const key of CASE_SITES) {
      for (const c of CASE_PAGES) {
        const page = pageFor(casePath(key, c.file))
        expect(page, `${key}/${c.file}`).not.toBeNull()
        expect(page!.name).toContain(c.label)
        expect(page!.about).toMatch(/sample system for a fictional/)
      }
    }
    for (const path of WRITEUPS) expect(pageFor(path), path).not.toBeNull()
    expect(pageFor('/cases/made-up/ai-agents.html')).toBeNull()
  })

  it('starts there with chips about the work being read, each with a real answer', () => {
    const chips = startersFor('/cases/ostler-barbers/ai-agents.html')
    expect(chips[0]).toBe('Tell me about this one')
    expect(startersFor('/ai-agents.html')).toEqual(chips)
    const reply = localAnswer(chips[0], pageFor('/cases/ostler-barbers/ai-agents.html'))
    expect(reply).toMatch(/^\*\*Ostler\*\* is a sample system .* fictional barbershop, and this page shows its RAG chatbots/)
    expect(reply).toContain('[the Ostler site](/samples/ostler-barbers.html)')
  })
})

describe('the framed panel', () => {
  let post: ReturnType<typeof vi.fn>
  beforeEach(() => {
    post = vi.fn()
    // The frame's parent is another window, the page around it.
    vi.spyOn(window, 'parent', 'get').mockReturnValue({ postMessage: post } as unknown as Window)
    window.history.replaceState(null, '', '/lumen?page=%2Fcases%2Fostler-barbers%2Fai-agents.html')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Hi.', { headers: { 'x-assistant-mode': 'local' } })))
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  const renderEmbed = () => render(<ChatEmbed ai paths={['/contact']} projects={[]} />)

  it('opens with the chips for the case it sits on, and sends that page with a question', async () => {
    renderEmbed()
    await userEvent.click(await screen.findByRole('button', { name: 'Tell me about this one' }))
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    expect(body.page).toBe('/cases/ostler-barbers/ai-agents.html')
  })

  it('tells the page around it to close, and takes its theme', async () => {
    renderEmbed()
    await userEvent.click(screen.getByRole('button', { name: chat.close }))
    expect(post).toHaveBeenCalledWith({ type: EMBED_MESSAGE.close }, window.location.origin)
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: EMBED_MESSAGE.theme, theme: 'light' }, origin: window.location.origin, source: window.parent as unknown as MessageEventSource }))
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('ignores messages from anywhere else', () => {
    renderEmbed()
    document.documentElement.setAttribute('data-theme', 'dark')
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: EMBED_MESSAGE.theme, theme: 'light' }, origin: 'https://evil.example', source: window.parent as unknown as MessageEventSource }))
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

describe('the launcher script', () => {
  const SCRIPT = readFileSync(join(PUBLIC, 'lumen-embed.js'), 'utf8')
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('adds the launcher, and opens the panel framed from /lumen with this page', async () => {
    window.history.replaceState(null, '', '/cases/ostler-barbers/ai-agents.html')
    new Function(SCRIPT)()
    const launcher = screen.getByRole('button', { name: chat.launcher })
    await userEvent.click(launcher)
    expect(launcher).toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelector('#lumen-embed iframe')?.getAttribute('src')).toBe('/lumen?page=%2Fcases%2Fostler-barbers%2Fai-agents.html')
    window.history.replaceState(null, '', '/')
  })

  it('does nothing inside a frame, where the site already has Lumen', () => {
    vi.spyOn(window, 'top', 'get').mockReturnValue({} as Window)
    new Function(SCRIPT)()
    expect(screen.queryByRole('button', { name: chat.launcher })).toBeNull()
  })
})
