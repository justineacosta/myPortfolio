import { prefersReducedMotion } from './motion'
import { PERF_KEY } from './storage-keys'

/**
 * Runtime performance gate (kape lib/perf.ts). Rather than guess at hardware,
 * the page measures itself once the expensive layers are running and steps the
 * design down until it holds frame:
 *
 *   high  everything on, as designed
 *   mid   backdrop-filter off (app/globals.css perf rules)
 *   low   the contour unmounts too; the flat Kraft --bg carries the page
 *
 * The verdict lands on <html data-perf> and is remembered for the tab in
 * sessionStorage (re-applied before paint by lib/boot.ts).
 */
export type PerfTier = 'high' | 'mid' | 'low'

export const PERF_TIER_EVENT = 'perftierchange'

/** Sustained median frame time above this means the device cannot hold ~45fps. */
export const BAD_FRAME_MS = 22
const SAMPLE_MS = 1500
/** Frames slower than this are a tab switch or a route change, not jank. */
const OUTLIER_MS = 100
/** Fewer usable samples than this and the window is inconclusive. */
const MIN_SAMPLES = 20
/** A janky device produces few frames, so a window may run this long to collect MIN_SAMPLES. */
const MAX_SAMPLE_MS = 5000
const MAX_CHECKS = 6

function read(): PerfTier | null {
  try {
    const v = sessionStorage.getItem(PERF_KEY)
    return v === 'mid' || v === 'low' ? v : null
  } catch {
    return null
  }
}

export function getPerfTier(): PerfTier {
  const v = document.documentElement.dataset.perf
  return v === 'mid' || v === 'low' ? v : 'high'
}

export function applyPerfTier(tier: PerfTier) {
  if (tier === getPerfTier()) return
  document.documentElement.dataset.perf = tier
  try {
    sessionStorage.setItem(PERF_KEY, tier)
  } catch {
    /* storage blocked: the tier still applies to this page */
  }
  window.dispatchEvent(new CustomEvent<PerfTier>(PERF_TIER_EVENT, { detail: tier }))
}

export function nextTier(t: PerfTier): PerfTier {
  return t === 'high' ? 'mid' : 'low'
}

export function isJanky(medianMs: number): boolean {
  return medianMs > BAD_FRAME_MS
}

/** Median frame time over one window, or null if the window was inconclusive. */
function measure(): Promise<number | null> {
  return new Promise((resolve) => {
    const deltas: number[] = []
    let last = performance.now()
    const end = last + SAMPLE_MS
    const hardEnd = last + MAX_SAMPLE_MS
    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (document.visibilityState === 'hidden') return resolve(null)
      if (dt < OUTLIER_MS) deltas.push(dt)
      const enough = now >= end && deltas.length >= MIN_SAMPLES
      if (!enough && now < hardEnd) return void requestAnimationFrame(tick)
      if (deltas.length < MIN_SAMPLES) return resolve(null)
      deltas.sort((a, b) => a - b)
      resolve(deltas[deltas.length >> 1])
    }
    requestAnimationFrame(tick)
  })
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Resolves once the page is running its expensive version: the intro has
 * released (Phase 2 sets html[data-intro] while it plays) and the contour
 * canvas has mounted, or after 10s for pages that never get one.
 */
function settled(): Promise<void> {
  return new Promise((resolve) => {
    const ready = () =>
      !document.documentElement.hasAttribute('data-intro') &&
      (!!document.querySelector('[data-contour] canvas') || getPerfTier() === 'low')
    const done = () => {
      window.clearInterval(id)
      window.clearTimeout(bail)
      setTimeout(resolve, 800)
    }
    const id = window.setInterval(() => {
      if (ready()) done()
    }, 200)
    const bail = window.setTimeout(done, 10_000)
    if (ready()) done()
  })
}

/**
 * Watches for a while and steps the tier down whenever a window comes back
 * janky. It judges a median over a full window, so one hitch never downgrades
 * anyone.
 */
export async function watchFrameHealth() {
  // Automated browsers render WebGL in software and would always downgrade;
  // the tier logic itself is covered by tests/perf.test.ts.
  if (navigator.webdriver) return
  if (prefersReducedMotion()) return
  if (read() === 'low') return

  await settled()

  for (let check = 0; check < MAX_CHECKS; check++) {
    if (getPerfTier() === 'low') return
    const median = await measure()
    if (median === null) {
      await wait(1200)
      continue
    }
    if (!isJanky(median)) {
      await wait(2500)
      continue
    }
    applyPerfTier(nextTier(getPerfTier()))
    await wait(600)
  }
}
