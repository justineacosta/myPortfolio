import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatRoot from '@/components/chat/ChatRoot'
import { NUDGE } from '@/components/chat/ChatNudge'
import { chat } from '@/data/chat'
import { CHAT_SOUND_KEY } from '@/lib/storage-keys'

const { play } = vi.hoisted(() => ({ play: vi.fn() }))
vi.mock('@/lib/chat/sound', async (orig) => ({ ...(await orig<typeof import('@/lib/chat/sound')>()), play }))
vi.mock('@/components/shell/NavigationProvider', () => ({ useShellNav: () => ({ go: vi.fn() }) }))

const renderChat = () => render(<ChatRoot ai paths={['/contact']} projects={[]} />)
const launcher = () => screen.getByRole('button', { name: chat.launcher })
const played = () => play.mock.calls.map((c) => c[0])

beforeEach(() => {
  play.mockReset()
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Hello there.', { headers: { 'x-assistant-mode': 'live' } })))
})
afterEach(() => vi.unstubAllGlobals())

describe('when Lumen makes a sound', () => {
  it('ticks on open and close, pops on send, and chimes once as the reply starts', async () => {
    renderChat()
    await userEvent.click(launcher())
    expect(played()).toEqual(['open'])
    const dialog = screen.getByRole('dialog', { name: chat.name })
    await userEvent.type(within(dialog).getByRole('textbox', { name: chat.message }), 'Hi{Enter}')
    await within(dialog).findByText('Hello there.', { ignore: '.sr-only, script, style' })
    expect(played()).toEqual(['open', 'send', 'reply'])
    await userEvent.click(within(dialog).getByRole('button', { name: chat.close }))
    expect(played()).toEqual(['open', 'send', 'reply', 'close'])
  })

  it('does not chime when the request fails, since no answer started', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: chat.errors.rate }, { status: 429 })))
    renderChat()
    await userEvent.click(launcher())
    const dialog = screen.getByRole('dialog', { name: chat.name })
    await userEvent.type(within(dialog).getByRole('textbox', { name: chat.message }), 'Hi{Enter}')
    await within(dialog).findByText('Too many messages', { exact: false, ignore: '.sr-only, script, style' })
    expect(played()).toEqual(['open', 'send'])
  })

  it('chimes when the greeting bubble appears', () => {
    vi.useFakeTimers()
    try {
      renderChat()
      act(() => vi.advanceTimersByTime(NUDGE.delayMs))
      expect(played()).toEqual(['nudge'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('has a mute button in the header that is remembered for the browser', async () => {
    renderChat()
    await userEvent.click(launcher())
    const mute = screen.getByRole('button', { name: chat.sound.mute })
    expect(mute).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(mute)
    expect(mute).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem(CHAT_SOUND_KEY)).toBe('off')
    fireEvent.click(mute)
    expect(mute).toHaveAttribute('aria-pressed', 'false')
    expect(localStorage.getItem(CHAT_SOUND_KEY)).toBeNull()
  })

  it('opens already muted when the visitor muted it before', async () => {
    localStorage.setItem(CHAT_SOUND_KEY, 'off')
    renderChat()
    await userEvent.click(launcher())
    expect(await screen.findByRole('button', { name: chat.sound.mute, pressed: true })).toBeInTheDocument()
  })
})
