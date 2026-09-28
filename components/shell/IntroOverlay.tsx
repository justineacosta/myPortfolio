'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ArrowRightIcon, CheckIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'
import {
  cablePath,
  claimIntro,
  EASE,
  easeInOutCubic,
  holdIntro,
  INTRO,
  INTRO_MAX_MS,
  introRequested,
  nodeCentres,
  registerIntroSkip,
  releaseHead,
  releasePage,
  restPose,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'
import { PANEL_ID, scrollToTop } from '@/lib/scroller'

const WORDS = home.headline.map((line) => line.split(' '))
const STEPS = home.intro.steps
const SVG_NS = 'http://www.w3.org/2000/svg'

// Decided once per page load from what the boot script set before first
// paint. StrictMode's dev remount re-reads this, not the (released) DOM.
let pending: boolean | null = null

/**
 * "The workflow writes the line" (spec §8): kape's IntroOverlay engine, Kraft's
 * loader steps and tokens. Web Animations for the keyframed parts and one rAF
 * loop for the progress-driven run; transform, opacity and stroke only.
 * The overlay is always in the DOM and shown by CSS only while
 * html[data-intro-head] is set (lib/intro.ts has the lifecycle).
 */
export default function IntroOverlay() {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dotRef = useRef<HTMLElement>(null)
  const dotCoreRef = useRef<HTMLElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const statusTextRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (pending === null) pending = introRequested()
    if (!pending) return
    holdIntro() // re-assert after a StrictMode remount released it
    claimIntro()

    const overlay = overlayRef.current
    const title = titleRef.current
    const canvas = canvasRef.current
    const svg = svgRef.current
    const dot = dotRef.current
    const dotCore = dotCoreRef.current
    const status = statusRef.current
    const statusText = statusTextRef.current
    if (!overlay || !title || !canvas || !svg || !dot || !dotCore || !status || !statusText) {
      pending = false
      releasePage(false)
      releaseHead()
      return
    }

    let cancelled = false
    let raf = 0
    const timers: number[] = []
    const anims: Animation[] = []
    const wait = (ms: number) => new Promise<void>((res) => void timers.push(window.setTimeout(res, ms)))
    const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = el.animate(frames, { fill: 'both', ...opts })
      anims.push(a)
      return a
    }
    const stop = () => {
      cancelled = true
      cancelAnimationFrame(raf)
      timers.forEach((t) => window.clearTimeout(t))
    }

    const startWidth = window.innerWidth
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    const onResize = () => {
      if (window.innerWidth !== startWidth) skip()
    }
    const done = () => {
      const hadFocus = overlay.contains(document.activeElement)
      pending = false
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      releasePage()
      releaseHead()
      // The Skip button just vanished; don't strand keyboard focus on <body>.
      if (hadFocus) document.getElementById(PANEL_ID)?.focus({ preventScroll: true })
    }
    const skip = () => {
      if (!pending) return
      stop()
      anims.forEach((a) => a.cancel())
      done()
    }
    skipRef.current = skip
    registerIntroSkip(skip)
    // Whatever goes wrong inside the run, the page comes back.
    timers.push(window.setTimeout(skip, INTRO_MAX_MS))
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    const run = async () => {
      await whenFontsReady(INTRO.fontWaitMs)
      if (cancelled) return
      const target = document.querySelector<HTMLElement>('[data-intro-target]')
      if (!target) return skip()
      scrollToTop({ smooth: false }) // a phone reload may restore a scrolled position

      const k = speedFor(window.matchMedia(SHELL_MIN_QUERY).matches)
      const IGNITE = INTRO.igniteMs * k
      const RUN = INTRO.runMs * k
      const LOCK = INTRO.lockMs * k
      const FLY = INTRO.flyMs * k

      // Same face, size and measure as the real headline, so scale 1 IS the landing.
      // offsetWidth ignores the page's rise-in transform; +1 absorbs sub-pixel rounding.
      title.style.fontSize = getComputedStyle(target).fontSize
      const width = target.offsetWidth + 1
      const height = target.offsetHeight
      title.style.width = `${width}px`
      canvas.style.width = `${width}px`
      canvas.style.height = `${INTRO.canvasH}px`

      const pose = restPose({ vw: window.innerWidth, vh: window.innerHeight, width, height })
      const rest = `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`
      const below = (gap: number) => `translate(${pose.x}px, ${pose.y + (height + gap) * pose.scale}px) scale(${pose.scale})`
      title.style.transform = rest
      canvas.style.transform = below(INTRO.canvasGap)
      title.style.opacity = '1'
      canvas.style.opacity = '1'

      // Nodes on the design canvas; the run travels from the first centre to the last.
      const nodes = Array.from(canvas.querySelectorAll<HTMLElement>('.intro-node'))
      nodes.forEach((el) => el.classList.remove('is-done'))
      status.classList.remove('is-done')
      statusText.textContent = home.intro.running
      const xs = nodeCentres(width, nodes.length, INTRO.node)
      nodes.forEach((el, i) => {
        el.style.left = `${xs[i] - INTRO.node / 2}px`
        el.style.top = `${INTRO.nodeY - INTRO.node / 2}px`
      })

      // Cables: a grey base per gap, and an accent path on top whose dashoffset the run pays out.
      svg.setAttribute('viewBox', `0 0 ${width} ${INTRO.canvasH}`)
      svg.setAttribute('width', String(width))
      svg.setAttribute('height', String(INTRO.canvasH))
      svg.replaceChildren()
      const cables: { live: SVGPathElement; len: number; from: number; to: number }[] = []
      for (let i = 0; i < nodes.length - 1; i++) {
        const from = xs[i] + INTRO.node / 2
        const to = xs[i + 1] - INTRO.node / 2
        const d = cablePath(from, to, INTRO.nodeY)
        const base = document.createElementNS(SVG_NS, 'path')
        base.setAttribute('d', d)
        base.setAttribute('class', 'intro-cable')
        const live = document.createElementNS(SVG_NS, 'path')
        live.setAttribute('d', d)
        live.setAttribute('class', 'intro-cable intro-cable--live')
        svg.append(base, live)
        const len = live.getTotalLength()
        live.style.strokeDasharray = `${len}`
        live.style.strokeDashoffset = `${len}`
        cables.push({ live, len, from, to })
        play(base, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 90 + i * 70, easing: EASE.out })
      }

      // Words: flex swallows literal spaces, so each line's gap is one measured space.
      const firstLine = title.querySelector<HTMLElement>('.intro-line')
      const probe = document.createElement('span')
      probe.className = 'intro-word'
      probe.textContent = ' '
      firstLine?.append(probe)
      const space = probe.getBoundingClientRect().width / pose.scale
      probe.remove()
      title.querySelectorAll<HTMLElement>('.intro-line').forEach((l) => {
        l.style.columnGap = `${space}px`
      })
      const inners = Array.from(title.querySelectorAll<HTMLElement>('.intro-word-in'))
      const gates = inners.map((el, i) => ({ el, at: i / inners.length, done: false }))

      // ---- Ignition ----
      nodes.forEach((el, i) =>
        play(el, [{ opacity: 0, transform: 'translateY(8px) scale(.86)' }, { opacity: 1, transform: 'none' }], {
          duration: 520,
          delay: i * 70,
          easing: EASE.spring,
        }),
      )
      play(dotCore, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: 320,
        delay: 200,
        easing: EASE.spring,
      })
      play(status, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: 160,
        easing: EASE.out,
      })
      await wait(IGNITE)
      if (cancelled) return

      // ---- Run: one progress value drives cables, dot, nodes and words ----
      const x0 = xs[0]
      const x1 = xs[xs.length - 1]
      const nodeAt = xs.map((x) => (x - x0) / (x1 - x0))
      const succeeded = nodes.map(() => false)
      const succeed = (i: number) => {
        succeeded[i] = true
        const el = nodes[i]
        el.classList.add('is-done')
        const check = el.querySelector('.intro-check')
        if (check) play(check, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 460, easing: EASE.spring })
        const card = el.querySelector('.intro-node-card')
        if (card) play(card, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: EASE.out })
      }
      succeed(0)
      await new Promise<void>((resolve, reject) => {
        const start = performance.now()
        // A frame that throws rejects the run, and run().catch(skip) hands the page back at once.
        const step = (now: number) => {
          try {
            if (cancelled) return resolve()
            const raw = Math.min(1, (now - start) / RUN)
            const p = easeInOutCubic(raw)
            const x = x0 + p * (x1 - x0)
            dot.style.transform = `translate3d(${x}px, ${INTRO.nodeY}px, 0)`
            for (const c of cables) {
              const f = Math.min(1, Math.max(0, (x - c.from) / (c.to - c.from)))
              c.live.style.strokeDashoffset = `${c.len * (1 - f)}`
            }
            for (let i = 1; i < nodes.length - 1; i++) if (!succeeded[i] && p >= nodeAt[i]) succeed(i)
            for (const g of gates) {
              if (!g.done && p >= g.at) {
                g.done = true
                play(g.el, [{ transform: 'translateY(132%)' }, { transform: 'translateY(0)' }], { duration: 760, easing: EASE.out })
              }
            }
            if (raw < 1) raf = requestAnimationFrame(step)
            else resolve()
          } catch (err) {
            reject(err)
          }
        }
        raf = requestAnimationFrame(step)
      })
      if (cancelled) return

      // ---- Lock ----
      play(dotCore, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'linear' })
      succeed(nodes.length - 1)
      status.classList.add('is-done')
      statusText.textContent = home.intro.done
      await wait(LOCK)
      if (cancelled) return

      // ---- Handoff: the canvas falls away, the headline flies home ----
      // Measured now, not at the start: the page's rise-in has long finished.
      const t = target.getBoundingClientRect()
      const landing = `translate(${t.left}px, ${t.top}px) scale(1)`
      play(canvas, [{ transform: below(INTRO.canvasGap), opacity: 1 }, { transform: below(INTRO.fallGap), opacity: 0 }], {
        duration: 420,
        easing: EASE.out,
      })
      const fly = play(title, [{ transform: rest }, { transform: landing }], { duration: FLY, easing: EASE.camera })
      const accent = title.querySelector('.intro-line--accent')
      if (accent) {
        // Kraft's loader: the accent line settles to ink as it lands.
        const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()
        play(accent, [{ color: getComputedStyle(accent).color }, { color: ink }], { duration: FLY * 0.7, easing: 'linear' })
      }
      await wait(FLY - 150)
      if (cancelled) return
      releasePage()
      await wait(150)
      if (cancelled) return
      // Commit the landing, so the resting pose stays readable once the overlay hides.
      title.style.transform = landing
      fly.cancel()
      done()
    }

    void run().catch(skip)

    return () => {
      stop()
      anims.forEach((a) => a.cancel())
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      skipRef.current = () => {}
      registerIntroSkip(null)
      // Never leave the page hidden. `pending` stays as it was, so a StrictMode remount replays.
      releasePage(false)
      releaseHead()
    }
  }, [])

  // Leaving Home mid-intro (sidebar, ⌘K, a card, Back) ends it at once.
  useEffect(() => {
    if (pathname !== '/') skipRef.current()
  }, [pathname])

  return (
    <div ref={overlayRef} className="intro" data-intro-overlay>
      <div ref={titleRef} className="intro-title" aria-hidden>
        {WORDS.map((words, li) => (
          <span key={li} className={`intro-line${li === WORDS.length - 1 ? ' intro-line--accent' : ''}`}>
            {words.map((w, wi) => (
              <span key={wi} className="intro-word">
                <span className="intro-word-in">{w}</span>
              </span>
            ))}
          </span>
        ))}
      </div>

      <div ref={canvasRef} className="intro-canvas" aria-hidden>
        <svg ref={svgRef} className="intro-cables" />
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const cls = `intro-node${i === 0 ? ' intro-node--trigger' : ''}${i === STEPS.length - 1 ? ' intro-node--last' : ''}`
          return (
            <span key={s.label} className={cls}>
              <span className="intro-node-card">
                <Icon size={18} />
                <span className="intro-check">
                  <CheckIcon size={9} weight="bold" />
                </span>
                <i className="intro-port intro-port--in" />
                <i className="intro-port intro-port--out" />
              </span>
              <span className="intro-label">{s.label}</span>
            </span>
          )
        })}
        <i ref={dotRef} className="intro-dot">
          <i ref={dotCoreRef} className="intro-dot-core" />
        </i>
        <span ref={statusRef} className="intro-status">
          <i className="intro-status-dot" />
          <span ref={statusTextRef}>{home.intro.running}</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Skip intro"
        onClick={() => skipRef.current()}
        className="intro-skip pointer-events-auto fixed right-[clamp(18px,4vw,44px)] bottom-[clamp(18px,4vw,40px)] flex min-h-10 cursor-pointer items-center gap-2 rounded-[11px] border border-b1 bg-s2 px-4 py-2.5 text-[12.5px] text-ink3 hover:border-b2 hover:text-ink2"
      >
        {home.intro.skip} <ArrowRightIcon size={14} aria-hidden />
      </button>
    </div>
  )
}
