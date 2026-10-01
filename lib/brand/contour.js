// The portfolio's contour lines behind a standalone page (spec 2026-10-01-light-backdrop §4.2), drawn with
// plain WebGL 1 instead of three.js. CONTOUR (the site's shader and timing, lib/contour.ts) is declared just
// above by the renderer. Same limits as the site: after load, at idle, fine pointer, motion allowed, not the
// low performance setting. If anything is missing, the flat --bg carries the page. The browser pauses
// requestAnimationFrame in a hidden tab, so the contour rests there too.
;(() => {
  const root = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const coarse = matchMedia('(pointer: coarse) and (hover: none)')
  const perf = () => {
    if (root.dataset.perf) return root.dataset.perf
    try {
      return sessionStorage.getItem('kraft-perf')
    } catch {
      return null
    }
  }
  const allowed = () => !reduce.matches && root.dataset.a11yMotion !== 'true' && !coarse.matches && perf() !== 'low'
  /** A token (`#rrggbb`, or Kraft's bare `r,g,b` for --amb) as 0–1 channels. */
  const color = (name) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim()
    const hex = /^#([0-9a-f]{6})$/i.exec(v)
    if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255)
    const t = v.split(',').map((n) => Number(n.trim()))
    return t.length === 3 && t.every((n) => Number.isFinite(n) && n >= 0) ? t.map((n) => Math.min(255, n) / 255) : null
  }

  let stop = null
  let ready = false
  const start = () => {
    if (stop || !ready || !allowed()) return
    const bg = color('--bg')
    const line = color('--amb')
    if (!bg || !line) return
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-contour', '')
    canvas.setAttribute('aria-hidden', 'true')
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false })
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return
    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }
    const vs = compile(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}')
    const fs = compile(gl.FRAGMENT_SHADER, `#extension GL_OES_standard_derivatives : enable\nprecision highp float;\n${CONTOUR.frag}`)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const at = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(at)
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
    const u = Object.fromEntries(['uTime', 'uMouse', 'uMousePace', 'uAspect', 'uBg', 'uLine'].map((n) => [n, gl.getUniformLocation(prog, n)]))

    // 1x pixel density, like the site.
    const size = () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(u.uAspect, innerWidth / innerHeight)
    }
    size()
    // The theme (or high contrast) changes the tokens; the colours ease to them on the contour's own clock.
    let target = { bg, line }
    const themeWatch = new MutationObserver(() => {
      const nb = color('--bg')
      const nl = color('--amb')
      if (nb && nl) target = { bg: nb, line: nl }
    })
    themeWatch.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-a11y-contrast'] })
    const tgt = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e) => {
      tgt.x = (e.clientX / innerWidth) * 2 - 1
      tgt.y = -(e.clientY / innerHeight) * 2 + 1
    }
    addEventListener('mousemove', onMove)
    addEventListener('resize', size)

    let raf = 0
    let time = 0
    let last = performance.now() - CONTOUR.frameInterval
    let lastX = 0
    let lastY = 0
    let pace = 0
    const ease = (from, to, k) => from.forEach((v, i) => (from[i] = v + (to[i] - v) * k))
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < CONTOUR.frameInterval - 1) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      time += CONTOUR.drift * dt
      const follow = 1 - Math.exp(-CONTOUR.follow * dt)
      cur.x += (tgt.x - cur.x) * follow
      cur.y += (tgt.y - cur.y) * follow
      const speed = Math.min(1, Math.hypot((cur.x - lastX) / Math.max(dt, 0.001), (cur.y - lastY) / Math.max(dt, 0.001)) * 0.4)
      pace += (speed - pace) * (1 - Math.exp(-CONTOUR.pace * dt))
      lastX = cur.x
      lastY = cur.y
      const k = 1 - Math.exp(-CONTOUR.theme * dt)
      ease(bg, target.bg, k)
      ease(line, target.line, k)
      gl.uniform1f(u.uTime, time)
      gl.uniform2f(u.uMouse, cur.x, cur.y)
      gl.uniform1f(u.uMousePace, pace)
      gl.uniform3fv(u.uBg, bg)
      gl.uniform3fv(u.uLine, line)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    const halt = () => {
      cancelAnimationFrame(raf)
      themeWatch.disconnect()
      removeEventListener('mousemove', onMove)
      removeEventListener('resize', size)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.remove()
      const lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
      stop = null
    }
    const lost = (e) => {
      e.preventDefault()
      halt()
    }
    canvas.addEventListener('webglcontextlost', lost)
    stop = halt
    document.body.prepend(canvas)
    raf = requestAnimationFrame(frame)
  }

  const recheck = () => {
    if (stop && !allowed()) stop()
    else start()
  }
  const begin = () => {
    const go = () => {
      ready = true
      start()
    }
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 })
    else setTimeout(go, 1500)
  }
  if (document.readyState === 'complete') begin()
  else addEventListener('load', begin, { once: true })
  reduce.addEventListener('change', recheck)
  coarse.addEventListener('change', recheck)
  new MutationObserver(recheck).observe(root, { attributes: true, attributeFilter: ['data-a11y-motion', 'data-perf'] })
})()
