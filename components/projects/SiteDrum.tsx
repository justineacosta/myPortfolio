'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { projects, type Site } from '@/data/projects'
import { cardLook, drumLayout, slotOrder, wrapY } from '@/lib/drum'
import { releaseRenderer } from '@/lib/webgl'

type Props = { sites: Site[]; onOpen: (site: Site) => void; onFail: () => void; paused?: boolean }
type Card = { site: Site; baseY: number; baseAngle: number; hot: number; dim: number }

/**
 * The 3D funnel drum (kape FunnelBarrel.tsx, spec §6). The sample sites'
 * thumbnails cover a slowly spinning, drifting drum:
 * - drag it to spin and scrub;
 * - hover a page to name it;
 * - click one to open its preview.
 * It loads only when the sites view opens and WebGL is allowed
 * (hooks/useWebGLAllowed.ts). If WebGL fails to start, or loses its context,
 * `onFail` hands the view back to the grid. The rendering stops while the
 * view is off screen, the tab is hidden, or a preview covers it.
 *
 * The canvas is hidden from assistive tech. The site list below it carries
 * the same pages as real buttons (spec §11). It is invisible until one of its
 * buttons holds keyboard focus.
 */
export default function SiteDrum({ sites, onOpen, onFail, paused = false }: Props) {
  const s = projects.sitesView
  const wrapRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  // The latest callbacks, without re-running the scene effect on each render.
  const onOpenRef = useRef(onOpen)
  const onFailRef = useRef(onFail)
  useEffect(() => {
    onOpenRef.current = onOpen
    onFailRef.current = onFail
  })
  // A preview stacked on top hides the drum: stop drawing it, and pick up where it was when it shows again.
  const pausedRef = useRef(paused)
  const kickRef = useRef<() => void>(() => {})
  useEffect(() => {
    pausedRef.current = paused
    if (!paused) kickRef.current()
  }, [paused])

  useEffect(() => {
    const wrap = wrapRef.current
    const label = labelRef.current
    const name = nameRef.current
    if (!wrap || !label || !name || sites.length === 0) return

    // A fresh canvas for every run. The cleanup force-loses its context, and a
    // canvas never gets a live one back, so reusing it (React's dev double run
    // of this effect) would hand the next renderer a dead context.
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'absolute inset-0 size-full touch-none'
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      onFailRef.current()
      return
    }
    wrap.prepend(canvas) // under the name label and the hint
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 4.2, 31) // back and above: the drum sits low, its rim an ellipse
    camera.lookAt(0, 0.5, 0)

    const L = drumLayout(sites.length)
    const loader = new THREE.TextureLoader()
    const textures = new Map<string, THREE.Texture>()
    const mats: THREE.MeshBasicMaterial[] = []
    const texture = (url: string) => {
      const known = textures.get(url)
      if (known) return known
      const t = loader.load(url, undefined, undefined, () => {
        // A thumbnail that won't load becomes a dim, flat card instead of a broken texture.
        for (const m of mats) {
          if (m.map !== t) continue
          m.map = null
          m.userData.base = 0.22
          m.needsUpdate = true
        }
      })
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter // the thumbnails aren't powers of two: no mipmaps
      t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      textures.set(url, t)
      return t
    }

    // Rounded corners as an alpha mask: a white card on black.
    const mask = document.createElement('canvas')
    mask.width = 300
    mask.height = 400
    const ctx = mask.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 300, 400)
      ctx.fillStyle = 'white'
      ctx.beginPath()
      // roundRect is missing before Safari 16 and Firefox 112: square corners there.
      if (typeof ctx.roundRect === 'function') ctx.roundRect(0, 0, 300, 400, 30)
      else ctx.rect(0, 0, 300, 400)
      ctx.fill()
    }
    const roundTex = new THREE.CanvasTexture(mask)
    roundTex.minFilter = THREE.LinearFilter

    // One curved card shape; each card only gets a rotation.
    const geo = new THREE.CylinderGeometry(L.radius, L.radius, L.cardH, 24, 1, true, -L.thetaLen / 2, L.thetaLen)
    const group = new THREE.Group() // spins
    const tilt = new THREE.Group() // frames the drum
    tilt.add(group)
    tilt.rotation.z = -0.04
    tilt.rotation.x = 0.16 // tipped so the top rim reads as an ellipse
    tilt.position.set(0, -1, 0)
    scene.add(tilt)

    const cards: THREE.Mesh[] = []
    slotOrder(sites.length, L.rows * L.cols).forEach((siteIndex, slot) => {
      const r = Math.floor(slot / L.cols)
      const c = slot % L.cols
      const mat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, transparent: true, alphaMap: roundTex })
      mat.userData.base = 1
      mats.push(mat)
      mat.map = texture(sites[siteIndex].thumb)
      const mesh = new THREE.Mesh(geo, mat)
      const baseAngle = c * L.anglePer + (r % 2 ? L.anglePer * 0.5 : 0) // brick offset
      mesh.rotation.y = baseAngle
      mesh.position.y = r * L.rowGap - L.towerH / 2 + L.rowGap / 2
      mesh.userData = { site: sites[siteIndex], baseY: mesh.position.y, baseAngle, hot: 0, dim: 1 } satisfies Card
      group.add(mesh)
      cards.push(mesh)
    })

    // ---- interaction ----
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(-2, -2)
    const pick = () => {
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster
        .intersectObjects(cards, false)
        .find((h) => ((h.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity > 0.08)
      return (hit?.object as THREE.Mesh | undefined) ?? null
    }

    let hovered: THREE.Mesh | null = null
    let scrollTarget = 0
    let scrollCurrent = 0
    let spinAngle = 0
    let spinTarget = 0
    let dragSpin = 0
    let inside = false
    let dragging = false
    let downX = 0
    let downY = 0
    let lastX = 0
    let lastY = 0
    let moved = 0

    const aim = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      label.style.left = `${e.clientX - rect.left}px`
      label.style.top = `${e.clientY - rect.top}px`
    }
    const setHovered = (m: THREE.Mesh | null) => {
      if (m === hovered) return
      hovered = m
      if (m) name.textContent = (m.userData as Card).site.name
      label.classList.toggle('is-on', !!m)
      canvas.style.cursor = m ? 'pointer' : 'grab'
    }
    const onMove = (e: PointerEvent) => {
      aim(e)
      spinTarget = pointer.x * 0.22
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      dragSpin += dx * 0.006
      scrollTarget += dy * 0.01
      moved += Math.abs(dx) + Math.abs(dy)
      lastX = e.clientX
      lastY = e.clientY
    }
    const onEnter = () => {
      inside = true
    }
    const onLeave = () => {
      inside = false
      pointer.set(-2, -2)
      setHovered(null)
    }
    const onDown = (e: PointerEvent) => {
      dragging = true
      downX = lastX = e.clientX
      downY = lastY = e.clientY
      moved = 0
      aim(e)
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onUp = (e: PointerEvent) => {
      const tap = moved < 6 && Math.abs(e.clientX - downX) < 6 && Math.abs(e.clientY - downY) < 6
      dragging = false
      canvas.releasePointerCapture?.(e.pointerId)
      if (!tap) return
      aim(e)
      const hit = pick()
      if (hit) onOpenRef.current((hit.userData as Card).site)
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      onFailRef.current()
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerenter', onEnter)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('webglcontextlost', onLost)

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth)
      const h = Math.max(1, wrap.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    // ---- the loop: sleeps while off screen or hidden, woken by kick() ----
    const clock = new THREE.Clock()
    let raf = 0
    let running = false
    let onScreen = true
    const frame = () => {
      if (document.hidden || !onScreen || pausedRef.current) {
        running = false
        return
      }
      raf = requestAnimationFrame(frame)
      const dt = Math.min(clock.getDelta(), 0.05)

      spinAngle += (inside ? 0.04 : 0.16) * dt // idle spin, slower under the pointer
      group.rotation.y = spinAngle + dragSpin + spinTarget * 0.4
      if (!inside) scrollTarget += 0.35 * dt // slow vertical drift
      scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(1, dt * 5)
      for (const m of cards) {
        const y = wrapY((m.userData as Card).baseY + scrollCurrent, L.towerH)
        if (m === hovered && Math.abs(y - m.position.y) > L.rowGap * 1.5) setHovered(null) // it wrapped away
        m.position.y = y
      }
      if (inside && !dragging) setHovered(pick())

      for (const m of cards) {
        const card = m.userData as Card
        const hot = m === hovered
        card.hot += ((hot ? 1 : 0) - card.hot) * Math.min(1, dt * 10)
        card.dim += ((!hovered || hot ? 1 : 0.4) - card.dim) * Math.min(1, dt * 8)
        const worldY = tilt.position.y + m.position.y
        const look = cardLook(worldY, L.rowGap)
        const pop = 1 + card.hot * 0.06
        m.rotation.y = card.baseAngle + worldY * 0.05 // a slight helix, from height, so it holds as cards wrap
        m.scale.set(look.taper * pop, pop, look.taper * pop)
        const mat = m.material as THREE.MeshBasicMaterial
        mat.opacity = look.opacity
        m.visible = look.opacity > 0.01
        mat.color.setScalar(mat.userData.base * card.dim)
      }
      renderer.render(scene, camera)
    }
    const kick = () => {
      if (running) return
      running = true
      clock.getDelta() // drop the time spent asleep
      raf = requestAnimationFrame(frame)
    }
    kickRef.current = kick
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true
        if (onScreen) kick()
      },
      { threshold: 0.01 },
    )
    io.observe(wrap)
    const onVisible = () => {
      if (!document.hidden && onScreen) kick()
    }
    document.addEventListener('visibilitychange', onVisible)
    canvas.style.cursor = 'grab'
    kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerenter', onEnter)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('webglcontextlost', onLost)
      geo.dispose()
      roundTex.dispose()
      mats.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      kickRef.current = () => {}
      releaseRenderer(renderer)
      canvas.remove()
    }
  }, [sites])

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={labelRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 flex -translate-x-1/2 translate-y-5 flex-col gap-0.5 rounded-[11px] border border-veil-line bg-veil-deep px-3 py-2 text-veil-ink opacity-0 transition-opacity duration-200 [&.is-on]:opacity-100"
      >
        <span className="font-mono text-[9.5px] tracking-[.14em] opacity-60">{s.siteKicker}</span>
        <span ref={nameRef} className="text-[13px] font-semibold whitespace-nowrap" />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[18px] left-1/2 -translate-x-1/2 font-mono text-[10.5px] tracking-[.16em] whitespace-nowrap text-veil-ink opacity-55"
      >
        {s.hint}
      </span>
      <ul
        aria-label={s.listLabel}
        className="pointer-events-none absolute inset-x-5 bottom-12 flex flex-wrap justify-center gap-2 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
      >
        {sites.map((site) => (
          <li key={site.file}>
            <button
              type="button"
              onClick={() => onOpen(site)}
              aria-label={`${s.open} ${site.name}`}
              className="cursor-pointer rounded-[10px] border border-veil-line bg-veil-deep px-3 py-2 font-mono text-[10.5px] tracking-[.1em] text-veil-ink"
            >
              {site.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
