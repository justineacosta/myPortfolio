'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ArrowRightIcon, CheckIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'
import {
  boxHalves,
  cablePath,
  claimIntro,
  EASE,
  easeInOutCubic,
  easeInOutSine,
  holdIntro,
  INTRO,
  INTRO_MAX_MS,
  introRequested,
  loaderLayout,
  nodeCentres,
  registerIntroSkip,
  releaseHead,
  releasePage,
  runPlan,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'
import { PANEL_ID, scrollToTop } from '@/lib/scroller'

const WORDS = home.headline.map((line) => line.split(' '))
const STEPS = home.intro.steps
const SVG_NS = 'http://www.w3.org/2000/svg'
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

// Decided once per page load from what the boot script set before first
// paint. StrictMode's dev remount re-reads this, not the (released) DOM.
let pending: boolean | null = null

/**
 * "The workflow writes the line" (spec §8): kape's IntroOverlay engine in
 * Kraft's loader layout (lib/intro.ts loaderLayout): the KRAFT mark, the
 * headline on the left at Kraft's size and the steps spread across under it. Web Animations for the keyframed parts and one rAF
 * loop for the progress-driven run; transform, opacity and stroke only.
 * The overlay is always in the DOM and shown by CSS only while
 * html[data-intro-head] is set (lib/intro.ts has the lifecycle).
 */
export default function IntroOverlay() {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
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
    const brand = brandRef.current
    const title = titleRef.current
    const canvas = canvasRef.current
    const svg = svgRef.current
    const dot = dotRef.current
    const dotCore = dotCoreRef.current
    const status = statusRef.current
    const statusText = statusTextRef.current
    if (!overlay || !brand || !title || !canvas || !svg || !dot || !dotCore || !status || !statusText) {
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
      const fontSize = getComputedStyle(target).fontSize
      title.style.fontSize = fontSize
      const width = target.offsetWidth + 1
      const height = target.offsetHeight
      title.style.width = `${width}px`

      const at = loaderLayout({ vw: window.innerWidth, vh: window.innerHeight, width, height, fontSize: parseFloat(fontSize) })
      canvas.style.width = `${at.canvasWidth}px`
      canvas.style.height = `${INTRO.canvasH}px`
      canvas.style.setProperty('--cs', String(at.canvasScale))
      const rest = `translate(${at.x}px, ${at.titleY}px) scale(${at.scale})`
      const steps = (drop = 0) => `translate(${at.x}px, ${at.canvasY + drop}px) scale(${at.canvasScale})`
      brand.style.transform = `translate(${at.x}px, ${at.logoY}px)`
      title.style.transform = rest
      canvas.style.transform = steps()
      title.style.opacity = '1'
      canvas.style.opacity = '1'

      // Nodes on the design canvas; the run travels from the first box to the last.
      const nodes = Array.from(canvas.querySelectorAll<HTMLElement>('.intro-node'))
      nodes.forEach((el) => el.classList.remove('is-done', 'is-lit'))
      status.classList.remove('is-done')
      statusText.textContent = home.intro.running
      const xs = nodeCentres(at.canvasWidth, nodes.length, INTRO.node)
      nodes.forEach((el, i) => {
        el.style.left = `${xs[i] - INTRO.node / 2}px`
        el.style.top = `${INTRO.nodeY - INTRO.node / 2}px`
      })

      // Cables: a grey base per gap, and an accent path on top whose dashoffset the run pays out.
      svg.setAttribute('viewBox', `0 0 ${at.canvasWidth} ${INTRO.canvasH}`)
      svg.setAttribute('width', String(at.canvasWidth))
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

      // Rings: the two ways round each box (over and under), drawn in as the light splits. Each box
      // holds its own, in its card's coordinates, over the border but under the check badge.
      const half0 = INTRO.node / 2
      const rings = nodes.map((node, i) => {
        const box = node.querySelector<SVGSVGElement>('.intro-ring-box')!
        box.setAttribute('viewBox', `0 0 ${INTRO.node} ${INTRO.node}`)
        box.replaceChildren()
        const halves = boxHalves(half0, half0, i === 0 ? half0 : INTRO.radius, INTRO.radius)
        return (['top', 'bottom'] as const).map((half) => {
          const path = document.createElementNS(SVG_NS, 'path')
          path.setAttribute('d', halves[half])
          path.setAttribute('class', 'intro-ring')
          path.dataset.node = String(i)
          path.dataset.half = half
          box.append(path)
          const len = path.getTotalLength()
          path.dataset.len = String(len)
          path.style.strokeDasharray = `${len}`
          path.style.strokeDashoffset = `${len}`
          return { path, len }
        })
      })
      const sparks = Array.from(canvas.querySelectorAll<HTMLElement>('.intro-spark'))
      const burst = canvas.querySelector<HTMLElement>('.intro-burst')
      sparks.forEach((el) => (el.style.opacity = '0'))
      dotCore.style.opacity = '0'
      if (burst) {
        burst.style.opacity = '0'
        burst.style.transform = 'scale(.2)'
      }

      // Words: flex swallows literal spaces, so each line's gap is one measured space.
      const firstLine = title.querySelector<HTMLElement>('.intro-line')
      const probe = document.createElement('span')
      probe.className = 'intro-word'
      probe.textContent = ' '
      firstLine?.append(probe)
      const space = probe.getBoundingClientRect().width / at.scale
      probe.remove()
      title.querySelectorAll<HTMLElement>('.intro-line').forEach((l) => {
        l.style.columnGap = `${space}px`
      })
      const inners = Array.from(title.querySelectorAll<HTMLElement>('.intro-word-in'))
      const gates = inners.map((el, i) => ({ el, at: i / inners.length, done: false }))

      // ---- Ignition ----
      play(brand, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: EASE.out })
      nodes.forEach((el, i) =>
        play(el, [{ opacity: 0, transform: 'translateY(8px) scale(.86)' }, { opacity: 1, transform: 'none' }], {
          duration: 520,
          delay: i * 70,
          easing: EASE.spring,
        }),
      )
      play(status, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: 160,
        easing: EASE.out,
      })
      await wait(IGNITE)
      if (cancelled) return

      // ---- Run: one clock walks the plan (lib/intro.ts runPlan) ----
      // The first icon bursts; at each box the light splits over and under it
      // and joins at its right middle, which checks the box; one dot runs the cable on.
      const plan = runPlan(nodes.length)
      const succeeded = nodes.map(() => false)
      const finished = plan.map(() => false)
      const drawRing = (i: number, f: number) => rings[i].forEach((r) => (r.path.style.strokeDashoffset = `${r.len * (1 - f)}`))
      const fillCable = (i: number, f: number) => (cables[i].live.style.strokeDashoffset = `${cables[i].len * (1 - f)}`)
      const succeed = (i: number) => {
        if (succeeded[i]) return
        succeeded[i] = true
        const el = nodes[i]
        el.classList.add('is-done')
        const check = el.querySelector('.intro-check')
        if (check) play(check, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 460, easing: EASE.spring })
        const card = el.querySelector('.intro-node-card')
        if (card) play(card, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: EASE.out })
      }
      // A segment the clock has passed is completed in full, even if a slow frame skipped it.
      const finish = (k: number) => {
        if (finished[k]) return
        finished[k] = true
        const s = plan[k]
        if (s.kind === 'burst' && burst) play(burst, [{ opacity: 1 }, { opacity: 0 }], { duration: INTRO.aroundMs * 1.4, easing: EASE.out })
        if (s.kind === 'around') {
          drawRing(s.i, 1)
          succeed(s.i)
        }
        if (s.kind === 'line') fillCable(s.i, 1)
      }
      const show = (el: HTMLElement, on: boolean) => (el.style.opacity = on ? '1' : '0')
      const place = (el: HTMLElement, x: number, y: number) => (el.style.transform = `translate3d(${x}px, ${y}px, 0)`)
      await new Promise<void>((resolve, reject) => {
        const start = performance.now()
        // A frame that throws rejects the run, and run().catch(skip) hands the page back at once.
        const step = (now: number) => {
          try {
            if (cancelled) return resolve()
            const raw = Math.min(1, (now - start) / RUN)
            plan.forEach((seg, k) => seg.end <= raw && finish(k))
            const s = raw >= 1 ? plan[plan.length - 1] : plan.find((seg) => raw < seg.end)!
            const f = Math.min(1, Math.max(0, (raw - s.start) / (s.end - s.start)))
            canvas.dataset.at = `${s.kind}${s.i}`
            const splitting = s.kind === 'around' && raw < 1
            show(dotCore, s.kind === 'line')
            sparks.forEach((el) => show(el, splitting))
            if (s.kind === 'burst' && burst) {
              const e = easeOutQuad(f)
              burst.style.opacity = String(e)
              burst.style.transform = `scale(${0.2 + 0.8 * e})`
            } else if (splitting) {
              const e = easeInOutSine(f)
              nodes[s.i].classList.add('is-lit')
              drawRing(s.i, e)
              rings[s.i].forEach((r, h) => {
                const pt = r.path.getPointAtLength(r.len * e)
                place(sparks[h], xs[s.i] - half0 + pt.x, INTRO.nodeY - half0 + pt.y)
              })
            } else if (s.kind === 'line') {
              const e = easeInOutCubic(f)
              const from = xs[s.i] + INTRO.node / 2
              const to = xs[s.i + 1] - INTRO.node / 2
              fillCable(s.i, e)
              place(dot, from + e * (to - from), INTRO.nodeY)
            }
            for (const g of gates) {
              if (!g.done && raw >= g.at) {
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

      // ---- Lock: Shipped was checked as its halves met; the run reports done ----
      sparks.forEach((el) => show(el, false))
      status.classList.add('is-done')
      statusText.textContent = home.intro.done
      await wait(LOCK)
      if (cancelled) return

      // ---- Handoff: the canvas falls away, the headline flies home ----
      // Measured now, not at the start: the page's rise-in has long finished.
      const t = target.getBoundingClientRect()
      const landing = `translate(${t.left}px, ${t.top}px) scale(1)`
      play(canvas, [{ transform: steps(), opacity: 1 }, { transform: steps(INTRO.fallPx), opacity: 0 }], {
        duration: 420,
        easing: EASE.out,
      })
      play(brand, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: EASE.out })
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
      <div ref={brandRef} className="intro-brand" aria-hidden>
        <Image src="/assets/kraft-mark.svg" alt="" width={INTRO.logo} height={INTRO.logo} className="block rounded-lg border border-b1" />
        <span>{profile.brand}</span>
      </div>
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
                {i === 0 && <span className="intro-burst" />}
                <Icon size={18} className="relative" />
                <svg className="intro-ring-box" width={INTRO.node} height={INTRO.node} />
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
        <i className="intro-spark" />
        <i className="intro-spark" />
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
