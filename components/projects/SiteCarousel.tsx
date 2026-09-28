'use client'

import Image from 'next/image'
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { projects, type Site } from '@/data/projects'

type Props = { sites: Site[]; onOpen: (site: Site) => void; running: boolean }

/** Kraft's spin ring (Kraft Projects Board.dc.html:274-283, 549-560, 614-616). */
const PANEL_W = 260
const SPIN_DEG_PER_S = 6
const DRAG_DEG_PER_PX = 0.28
const INERTIA = 0.93
/** A press that travels further than this is a drag, not a click. */
const CLICK_SLOP_PX = 6

/**
 * Kraft's spin carousel: the sample sites on a ring of 3D faces, built in DOM
 * and CSS transforms, with no WebGL. The sites view shows it wherever the 3D
 * drum can't run (WebGL won't start, its context is lost, or it crashes), and
 * it is what the pre-rendered page carries. It turns on its own, a drag spins
 * it with inertia, a click opens a page, and a page that takes keyboard focus
 * turns to the front. It only animates while `running`.
 */
export default function SiteCarousel({ sites, onOpen, running }: Props) {
  const s = projects.sitesView
  const ringRef = useRef<HTMLUListElement>(null)
  const step = 360 / Math.max(sites.length, 1)
  const radius = Math.round(PANEL_W / 2 / Math.tan(Math.PI / Math.max(sites.length, 3))) + 60

  // Motion state lives in a ref: it changes every frame and never needs a render.
  const m = useRef({ rot: 0, vel: 0, px: null as number | null, travel: 0, held: false })

  const paint = () => {
    if (ringRef.current) ringRef.current.style.transform = `rotateY(${m.current.rot.toFixed(2)}deg)`
  }

  // Dragging: the press starts on the stage; move and release are heard on the window, so a drag can leave the ring.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const st = m.current
      if (st.px === null) return
      const dx = e.clientX - st.px
      st.px = e.clientX
      st.travel += Math.abs(dx)
      st.rot += dx * DRAG_DEG_PER_PX
      st.vel = dx * DRAG_DEG_PER_PX
      paint()
    }
    const onUp = () => {
      m.current.px = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  // The spin: inertia after a drag, else a slow turn. Paused while held (focus) or not running.
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const st = m.current
      const dt = Math.min(64, t - last)
      last = t
      if (st.px === null && !st.held) {
        if (Math.abs(st.vel) > 0.02) {
          st.rot += st.vel
          st.vel *= INERTIA
        } else st.rot += (SPIN_DEG_PER_S * dt) / 1000
      }
      paint()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    Object.assign(m.current, { px: e.clientX, vel: 0, travel: 0 })
  }

  return (
    <div data-carousel className="relative flex min-h-0 flex-1 flex-col">
      <div
        onPointerDown={onDown}
        className="relative grid min-h-0 flex-1 cursor-grab touch-none place-items-center overflow-hidden [perspective:1400px] active:cursor-grabbing"
      >
        <ul
          ref={ringRef}
          data-carousel-ring
          aria-label={s.listLabel}
          className="relative h-[400px] w-[260px] [transform-style:preserve-3d] will-change-transform max-sm:scale-[.78]"
          onFocus={(e) => {
            const i = Number((e.target as HTMLElement).closest('li')?.dataset.index)
            if (Number.isNaN(i)) return
            Object.assign(m.current, { rot: -i * step, vel: 0, held: true })
            paint()
          }}
          onBlur={() => {
            m.current.held = false
          }}
        >
          {sites.map((site, i) => (
            <li
              key={site.file}
              data-index={i}
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: `rotateY(${(i * step).toFixed(2)}deg) translateZ(${radius}px)` }}
            >
              <button
                type="button"
                aria-label={`${s.open} ${site.name}`}
                onClickCapture={(e) => {
                  // The end of a drag is not a click on whichever page it ended over.
                  if (m.current.travel > CLICK_SLOP_PX) {
                    e.preventDefault()
                    e.stopPropagation()
                    m.current.travel = 0
                  }
                }}
                onClick={() => onOpen(site)}
                className="absolute inset-0 cursor-pointer overflow-hidden rounded-[14px] border border-b2 bg-s1 p-0 shadow-(--shot-shadow) transition-colors duration-250 hover:border-veil-ink"
              >
                <Image src={site.thumb} alt="" fill sizes="260px" className="object-cover object-top" draggable={false} />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-veil-deep px-[11px] py-[9px] text-left font-mono text-[10px] tracking-[.1em] text-veil-ink"
                >
                  {site.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[18px] left-1/2 -translate-x-1/2 font-mono text-[10.5px] tracking-[.16em] whitespace-nowrap text-veil-ink opacity-55"
        >
          {s.hint}
        </span>
      </div>
    </div>
  )
}
