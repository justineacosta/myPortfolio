import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ChatRoot from '@/components/chat/ChatRoot'
import { NUDGE } from '@/components/chat/ChatNudge'
import { chat } from '@/data/chat'
import { CHAT_NUDGE_KEY } from '@/lib/storage-keys'

vi.mock('@/components/shell/NavigationProvider', () => ({ useShellNav: () => ({ go: vi.fn() }) }))

const renderChat = () => render(<ChatRoot ai paths={['/contact']} projects={[]} />)
const bubble = () => screen.queryByRole('button', { name: chat.nudge.text })
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
})
afterEach(() => vi.useRealTimers())

describe('the launcher and its greeting bubble', () => {
  it('shows the message icon on the launcher, not a picture', () => {
    renderChat()
    const launcher = screen.getByRole('button', { name: chat.launcher })
    expect(launcher.querySelector('svg')).toBeInTheDocument()
    expect(launcher.querySelector('img')).toBeNull()
  })

  it('says "How can I help?" a few seconds into a visit, once, and opens Lumen when tapped', () => {
    renderChat()
    expect(bubble()).toBeNull()
    wait(NUDGE.delayMs)
    expect(bubble()).toBeInTheDocument()
    expect(sessionStorage.getItem(CHAT_NUDGE_KEY)).not.toBeNull()
    fireEvent.click(bubble()!)
    expect(screen.getByRole('dialog', { name: chat.name })).toBeInTheDocument()
    expect(bubble()).toBeNull()
  })

  it('waits out the intro', () => {
    document.documentElement.setAttribute('data-intro', '')
    renderChat()
    wait(NUDGE.delayMs + 3 * NUDGE.retryMs)
    expect(bubble()).toBeNull()
    document.documentElement.removeAttribute('data-intro')
    wait(NUDGE.retryMs)
    expect(bubble()).toBeInTheDocument()
  })

  it('closes with its ×', () => {
    renderChat()
    wait(NUDGE.delayMs)
    fireEvent.click(screen.getByRole('button', { name: chat.nudge.dismiss }))
    expect(bubble()).toBeNull()
  })

  it('stays gone after the chat is opened and closed from the launcher', () => {
    renderChat()
    wait(NUDGE.delayMs)
    expect(bubble()).toBeInTheDocument()
    const launcher = screen.getByRole('button', { name: chat.launcher })
    fireEvent.click(launcher)
    fireEvent.click(launcher)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(bubble()).toBeNull()
  })

  it('does not come back later in the same visit', () => {
    sessionStorage.setItem(CHAT_NUDGE_KEY, '1')
    renderChat()
    wait(NUDGE.delayMs * 3)
    expect(bubble()).toBeNull()
  })
})
