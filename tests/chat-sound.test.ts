import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_SOUND_KEY } from '@/lib/storage-keys'

/** A stand-in for Web Audio: records each note started, and whether the context was asked to resume. */
function fakeAudio(state: AudioContextState) {
  const started: number[] = []
  const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
  const ctx = {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: () => {
      const osc = { type: 'sine', frequency: param(), connect: (n: unknown) => n, start: (t: number) => started.push(t), stop: vi.fn() }
      return osc
    },
    createGain: () => ({ gain: param(), connect: (n: unknown) => n }),
  }
  vi.stubGlobal(
    'AudioContext',
    class {
      constructor() {
        return ctx
      }
    },
  )
  return { ctx, started }
}

/** The sound module fresh, so its one audio context is made again for each test. */
const load = async () => {
  vi.resetModules()
  return import('@/lib/chat/sound')
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe("Lumen's sounds", () => {
  it('plays every note of a sound once the browser allows audio', async () => {
    const { started } = fakeAudio('running')
    const { play, SOUNDS } = await load()
    play('reply')
    expect(started).toHaveLength(SOUNDS.reply.length)
    play('send')
    expect(started).toHaveLength(SOUNDS.reply.length + SOUNDS.send.length)
  })

  it('plays a sound asked for in the click that wakes the audio up', async () => {
    const { ctx, started } = fakeAudio('suspended')
    const { play, SOUNDS } = await load()
    play('open')
    expect(ctx.resume).toHaveBeenCalled()
    await Promise.resolve()
    await Promise.resolve()
    expect(started).toHaveLength(SOUNDS.open.length)
  })

  it('drops a sound asked for long before any click, instead of playing it late', async () => {
    vi.useFakeTimers()
    try {
      const { ctx, started } = fakeAudio('suspended')
      let wake = () => {}
      ctx.resume = vi.fn(() => new Promise<void>((r) => (wake = r)))
      const { play, RESUME_GRACE_MS } = await load()
      play('nudge')
      vi.advanceTimersByTime(RESUME_GRACE_MS * 20)
      wake()
      await Promise.resolve()
      await Promise.resolve()
      expect(started).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stays silent when muted, and remembers the choice for the browser', async () => {
    const { started } = fakeAudio('running')
    const { play, setMuted, isMuted } = await load()
    setMuted(true)
    expect(localStorage.getItem(CHAT_SOUND_KEY)).toBe('off')
    expect(isMuted()).toBe(true)
    play('send')
    expect(started).toHaveLength(0)
    setMuted(false)
    expect(isMuted()).toBe(false)
    play('send')
    expect(started).toHaveLength(1)
  })

  it('does nothing, and never throws, where Web Audio is missing', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const { play } = await load()
    expect(() => play('open')).not.toThrow()
  })

  it('keeps every sound short and quiet', async () => {
    const { SOUNDS } = await load()
    for (const notes of Object.values(SOUNDS)) {
      for (const n of notes) {
        expect(n.gain).toBeLessThanOrEqual(0.05)
        expect(n.at * 1000 + n.ms).toBeLessThanOrEqual(300)
      }
    }
  })
})
