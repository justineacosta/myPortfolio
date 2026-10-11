import { CHAT_SOUND_KEY } from '@/lib/storage-keys'

/**
 * Lumen's sounds: short, quiet tones made in the browser with Web Audio, so
 * there are no files to download. Each sound is a few notes, each a sine or
 * triangle wave with a soft attack and a quick fade. Browsers only let a page
 * make sound after the visitor has clicked or typed, so a sound asked for
 * before that is simply skipped. Muting is kept for the browser.
 */

export type Sound = 'send' | 'reply' | 'open' | 'close' | 'nudge'

type Note = { hz: number; to?: number; at: number; ms: number; gain: number; wave?: OscillatorType }

/** The notes of each sound: `at` is when it starts after the sound does, `to` a pitch it slides to. */
export const SOUNDS: Record<Sound, Note[]> = {
  // A small rising pop as the question leaves.
  send: [{ hz: 620, to: 880, at: 0, ms: 90, gain: 0.05 }],
  // Two soft notes, up a fourth, as the answer starts.
  reply: [
    { hz: 784, at: 0, ms: 140, gain: 0.04, wave: 'triangle' },
    { hz: 1046, at: 0.09, ms: 200, gain: 0.035, wave: 'triangle' },
  ],
  // A light tick, a touch higher opening than closing.
  open: [{ hz: 540, at: 0, ms: 60, gain: 0.035 }],
  close: [{ hz: 420, at: 0, ms: 60, gain: 0.03 }],
  // A quiet two-note hello for the greeting bubble.
  nudge: [
    { hz: 880, at: 0, ms: 120, gain: 0.025, wave: 'triangle' },
    { hz: 1175, at: 0.1, ms: 180, gain: 0.02, wave: 'triangle' },
  ],
}

/** Whether the visitor has muted the sounds. Storage that throws counts as not muted. */
export function isMuted(): boolean {
  try {
    return localStorage.getItem(CHAT_SOUND_KEY) === 'off'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  try {
    if (muted) localStorage.setItem(CHAT_SOUND_KEY, 'off')
    else localStorage.removeItem(CHAT_SOUND_KEY)
  } catch {
    /* storage blocked: the choice lasts as long as the page */
  }
}

let ctx: AudioContext | null = null

/** The one audio context, made on first use; none where Web Audio is missing. */
function audio(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = typeof window === 'undefined' ? undefined : window.AudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/** How long a sound may wait for the browser to allow audio. A click allows it at once; a page that hasn't been clicked never does. */
export const RESUME_GRACE_MS = 150

/** Plays a sound, unless muted or the browser hasn't allowed sound yet. Never throws. */
export function play(sound: Sound): void {
  if (isMuted()) return
  try {
    const ac = audio()
    if (!ac) return
    if (ac.state === 'running') return notes(ac, sound)
    if (ac.state !== 'suspended') return
    // Sound is allowed once the visitor has clicked or typed. Inside a click, resuming takes a moment,
    // so the sound waits for it; a resume that only lands later (at some future click) plays nothing.
    const asked = Date.now()
    ac.resume()
      .then(() => {
        if (Date.now() - asked <= RESUME_GRACE_MS && !isMuted()) notes(ac, sound)
      })
      .catch(() => {})
  } catch {
    /* a sound is never worth an error */
  }
}

/** Schedules a sound's notes from now. */
function notes(ac: AudioContext, sound: Sound): void {
  try {
    const now = ac.currentTime
    for (const n of SOUNDS[sound]) {
      const start = now + n.at
      const end = start + n.ms / 1000
      const osc = ac.createOscillator()
      const amp = ac.createGain()
      osc.type = n.wave ?? 'sine'
      osc.frequency.setValueAtTime(n.hz, start)
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, end)
      amp.gain.setValueAtTime(0.0001, start)
      amp.gain.exponentialRampToValueAtTime(n.gain, start + 0.008)
      amp.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(amp).connect(ac.destination)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  } catch {
    /* a sound is never worth an error */
  }
}
