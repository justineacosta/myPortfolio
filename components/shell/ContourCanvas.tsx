'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { readContourColors, type RGB } from '@/lib/color'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'
import { THEME_EVENT } from '@/lib/theme'
import { releaseRenderer } from '@/lib/webgl'

// kape's vertex shader, verbatim; the fragment shader and its credits live in lib/contour.ts.
const vert = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
`

const { frameInterval: FRAME_INTERVAL, drift: DRIFT_PER_SECOND, follow: FOLLOW_PER_SECOND, pace: PACE_PER_SECOND, theme: THEME_PER_SECOND } = CONTOUR_TIMING

export default function ContourCanvas({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const colors = readContourColors()
    if (!el || !colors) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false })
    } catch {
      onFail()
      return
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
    cam.position.z = 1

    const bg = new THREE.Vector3(...colors.bg)
    const line = new THREE.Vector3(...colors.line)
    const targetBg = bg.clone()
    const targetLine = line.clone()
    renderer.setClearColor(new THREE.Color(...colors.bg), 1)

    const onTheme = () => {
      const next = readContourColors()
      if (!next) return
      targetBg.set(...(next.bg as RGB))
      targetLine.set(...(next.line as RGB))
    }
    window.addEventListener(THEME_EVENT, onTheme)

    const mouse = new THREE.Vector2(0, 0)
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: CONTOUR_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: mouse },
        uMousePace: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uBg: { value: bg },
        uLine: { value: line },
      },
    })
    scene.add(new THREE.Mesh(geo, mat))

    const tgt = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      tgt.x = (e.clientX / window.innerWidth) * 2 - 1
      tgt.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      mat.uniforms.uAspect.value = window.innerWidth / window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let visible = document.visibilityState !== 'hidden'
    const onVisibility = () => {
      const next = document.visibilityState !== 'hidden'
      if (next && !visible) {
        visible = true
        lastTs = performance.now()
        raf = requestAnimationFrame(loop)
      } else visible = next
    }
    document.addEventListener('visibilitychange', onVisibility)

    let time = 0
    let lastTs = performance.now()
    let lastCurX = 0
    let lastCurY = 0
    let pace = 0

    function loop(now: number = performance.now()) {
      if (!visible) return
      raf = requestAnimationFrame(loop)
      if (now - lastTs < FRAME_INTERVAL - 1) return
      const dt = Math.min(0.05, (now - lastTs) / 1000)
      lastTs = now
      time += DRIFT_PER_SECOND * dt

      const followK = 1 - Math.exp(-FOLLOW_PER_SECOND * dt)
      cur.x += (tgt.x - cur.x) * followK
      cur.y += (tgt.y - cur.y) * followK
      mouse.set(cur.x, cur.y)
      const dx = (cur.x - lastCurX) / Math.max(dt, 0.001)
      const dy = (cur.y - lastCurY) / Math.max(dt, 0.001)
      const velRaw = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.4)
      pace += (velRaw - pace) * (1 - Math.exp(-PACE_PER_SECOND * dt))
      lastCurX = cur.x
      lastCurY = cur.y

      const themeK = 1 - Math.exp(-THEME_PER_SECOND * dt)
      bg.lerp(targetBg, themeK)
      line.lerp(targetLine, themeK)

      mat.uniforms.uTime.value = time
      mat.uniforms.uMousePace.value = pace
      renderer.render(scene, cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(THEME_EVENT, onTheme)
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      releaseRenderer(renderer)
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      geo.dispose()
      mat.dispose()
    }
  }, [onFail])

  return <div ref={ref} data-contour aria-hidden className="pointer-events-none fixed inset-0 z-0" />
}
