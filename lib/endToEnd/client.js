// The End-to-End Workflow page's behaviour (public/end-to-end.html), inlined
// by lib/endToEnd/render.ts. Adapted from lib/buildPlan/client.js, without its
// test matrix. Plain browser JS, no libraries (spec §4.3).
;(() => {
  const root = document.documentElement

  // Inside the portfolio's dialog, wear the site's theme and access settings.
  // The site treats a missing data-theme as dark. Its text size is left out:
  // the site already zooms the whole window, iframe included.
  const MIRROR = ['data-a11y-motion', 'data-a11y-contrast', 'data-a11y-links']
  let host = null
  try {
    if (window.parent !== window) host = window.parent.document.documentElement
  } catch {
    host = null
  }
  if (host) {
    const mirror = () => {
      root.dataset.theme = host.dataset.theme === 'light' ? 'light' : 'dark'
      for (const name of MIRROR) {
        const v = host.getAttribute(name)
        if (v === null) root.removeAttribute(name)
        else root.setAttribute(name, v)
      }
    }
    mirror()
    new MutationObserver(mirror).observe(host, { attributes: true, attributeFilter: ['data-theme', ...MIRROR] })
    root.dataset.embedded = ''
  }
  const reduced = () => root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches
  const panel = document.getElementById('node-panel')

  if (host) {
    // Escape closes the site's window, as it does everywhere else on the site,
    // unless it is closing the settings panel.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || panel.matches(':popover-open')) return
      window.frameElement?.closest('dialog')?.close()
    })
    // Section links scroll in place and add no history, so Back still closes the window.
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = document.getElementById(a.getAttribute('href').slice(1))
      if (!target) return
      e.preventDefault()
      const top = target.getBoundingClientRect().top + scrollY - 64
      window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' })
      history.replaceState(null, '', a.getAttribute('href'))
    })
  }

  // The lane chips mark the lane on screen.
  const links = [...document.querySelectorAll('.toc a')]
  const linkFor = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]))
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const a = linkFor.get(e.target.id)
        if (!a) continue
        for (const l of links) l.removeAttribute('aria-current')
        a.setAttribute('aria-current', 'true')
        const bar = a.parentElement
        bar.scrollLeft = a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2
      }
    },
    { rootMargin: '-15% 0px -70% 0px' },
  )
  for (const id of linkFor.keys()) {
    const s = document.getElementById(id)
    if (s) spy.observe(s)
  }

  // A step (or a key item, or a job stage) explains itself in a small panel,
  // like n8n's side panel: what happens there first, then its settings. The
  // panel stays beside its step as the page or a diagram scrolls, and closes
  // once the step leaves the screen. Clicking the open step closes it.
  const nodes = JSON.parse(document.getElementById('graph-nodes').textContent)
  const closeBtn = panel.querySelector('[data-p=close]')
  let shown = null
  let side = 'below'
  let pressedShown = false
  const view = () => [document.documentElement.clientWidth, document.documentElement.clientHeight]
  const close = (focusBack) => {
    if (!shown) return
    const back = shown
    shown = null
    back.setAttribute('aria-expanded', 'false')
    if (panel.matches(':popover-open')) panel.hidePopover()
    if (focusBack) back.focus({ preventScroll: true })
  }
  const place = () => {
    if (!shown) return
    const r = shown.getBoundingClientRect()
    const [vw, vh] = view()
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) {
      close(false)
      return
    }
    const w = panel.offsetWidth
    const h = panel.offsetHeight
    panel.style.left = `${Math.max(12, Math.min(r.left + r.width / 2 - w / 2, vw - w - 12))}px`
    panel.style.top = `${side === 'below' ? r.bottom + 8 : Math.max(12, r.top - h - 10)}px`
  }
  const open = (btn) => {
    const n = nodes[btn.dataset.node]
    if (!n) return
    close(false)
    panel.querySelector('[data-p=type]').textContent = n.type
    panel.querySelector('[data-p=label]').textContent = n.label
    panel.querySelector('[data-p=what]').textContent = n.what
    panel.querySelector('dl').hidden = n.settings.length === 0
    panel.querySelector('dl').replaceChildren(
      ...n.settings.flatMap(([k, v]) => {
        const dt = document.createElement('dt')
        dt.textContent = k
        const dd = document.createElement('dd')
        dd.textContent = v
        return [dt, dd]
      }),
    )
    shown = btn
    btn.setAttribute('aria-expanded', 'true')
    // The source puts the panel right after its step in the Tab order.
    panel.showPopover({ source: btn })
    side = btn.getBoundingClientRect().bottom + 8 + panel.offsetHeight > view()[1] - 12 ? 'above' : 'below'
    place()
    closeBtn.focus()
  }
  panel.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') close(true)
  })
  closeBtn.addEventListener('click', () => close(true))
  document.addEventListener(
    'pointerdown',
    (e) => {
      pressedShown = !!shown && e.target.closest('[data-node]') === shown
    },
    true,
  )
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-node]')
    const pressed = pressedShown
    pressedShown = false
    if (!btn) return
    if (pressed || btn === shown) close(true)
    else open(btn)
  })
  let frame = 0
  const follow = () => {
    if (!shown || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      place()
    })
  }
  document.addEventListener('scroll', follow, { capture: true, passive: true })
  addEventListener('resize', follow)

  // Balls stand for jobs moving through each workflow while it is on screen.
  // They leave one at a time, a random 0.7–2 s apart (at most three on a
  // graph), and each takes one random route from start to end. A step or
  // connector lights up as a ball passes. Reduced motion turns it all off.
  const SPEED = 220 // px a second
  const MAX = 5
  const runs = [...document.querySelectorAll('.canvas[data-run]')].map((fig) => ({
    fig,
    routes: JSON.parse(fig.dataset.routes || '[]'),
    paths: [...fig.querySelectorAll('.run-dot')].map((d) => d.style.offsetPath),
    stage: fig.querySelector('.stage'),
    nodes: new Map([...fig.querySelectorAll('.node[data-node]')].map((b) => [b.dataset.node, b])),
    edges: [...fig.querySelectorAll('.edge')],
    balls: [],
    timer: 0,
    on: false,
  }))
  const launch = (r) => {
    if (r.balls.length >= MAX || !r.routes.length) return
    const i = Math.floor(Math.random() * r.routes.length)
    const el = document.createElement('span')
    el.className = 'run-ball'
    el.setAttribute('aria-hidden', 'true')
    el.dataset.route = String(i)
    el.style.offsetPath = r.paths[i]
    r.stage.insertBefore(el, r.stage.querySelector('.node'))
    const duration = Math.max(400, (r.routes[i].len / SPEED) * 1000)
    const anim = el.animate(
      [
        { offsetDistance: '0%', opacity: 0 },
        { offsetDistance: '2%', opacity: 1, offset: 0.02 },
        { offsetDistance: '98%', opacity: 1, offset: 0.98 },
        { offsetDistance: '100%', opacity: 0 },
      ],
      { duration, easing: 'linear' },
    )
    const ball = { el, anim, route: r.routes[i] }
    r.balls.push(ball)
    anim.finished.then(
      () => {
        el.remove()
        r.balls = r.balls.filter((b) => b !== ball)
      },
      () => {},
    )
  }
  const schedule = (r) => {
    clearTimeout(r.timer)
    if (!r.on) return
    r.timer = setTimeout(() => {
      launch(r)
      schedule(r)
    }, 700 + Math.random() * 1300)
  }
  const play = (r) => {
    if (r.on) return
    r.on = true
    r.fig.classList.add('playing')
    for (const b of r.balls) b.anim.play()
    if (!r.balls.length) launch(r)
    schedule(r)
  }
  const stop = (r, drop) => {
    r.on = false
    clearTimeout(r.timer)
    r.fig.classList.remove('playing')
    for (const b of r.balls) {
      if (drop) b.anim.cancel()
      else b.anim.pause()
    }
    if (drop) {
      for (const b of r.balls) b.el.remove()
      r.balls = []
    }
    for (const el of r.fig.querySelectorAll('.lit')) el.classList.remove('lit')
  }
  const byFig = new Map(runs.map((r) => [r.fig, r]))
  const run = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const r = byFig.get(e.target)
      if (e.isIntersecting && !reduced()) play(r)
      else stop(r, reduced())
    }
  })
  for (const r of runs) run.observe(r.fig)
  const light = () => {
    for (const r of runs) {
      if (!r.on) continue
      if (reduced()) {
        stop(r, true)
        continue
      }
      const lit = new Set()
      const litEdges = new Set()
      for (const b of r.balls) {
        const t = ((Number(b.anim.currentTime) || 0) / 1000) * SPEED
        for (const [key, at] of b.route.stops) if (Math.abs(t - at) < 30) lit.add(key)
        for (const [i, from, to] of b.route.spans) if (t >= from && t <= to) litEdges.add(i)
      }
      for (const [key, el] of r.nodes) el.classList.toggle('lit', lit.has(key))
      r.edges.forEach((el, i) => el.classList.toggle('lit', litEdges.has(i)))
    }
    requestAnimationFrame(light)
  }
  requestAnimationFrame(light)

  // Wide diagrams, tables and code blocks scroll sideways with no scrollbar.
  // Fading edges show there is more; diagrams also pan by dragging with the
  // mouse (touch already swipes), and the arrow buttons step through them.
  const scrollers = [...document.querySelectorAll('.canvas-scroll, .table-wrap, pre.code')]
  const edges = (s) => {
    const max = s.scrollWidth - s.clientWidth
    s.toggleAttribute('data-more-left', s.scrollLeft > 2)
    s.toggleAttribute('data-more-right', s.scrollLeft < max - 2)
    const fig = s.closest('.canvas')
    if (!fig) return
    fig.toggleAttribute('data-overflow', max > 1)
    const [back, next] = fig.querySelectorAll('.pan-btn')
    back.disabled = s.scrollLeft <= 2
    next.disabled = s.scrollLeft >= max - 2
  }
  const fit = () => {
    for (const s of scrollers) edges(s)
  }
  for (const s of scrollers) s.addEventListener('scroll', () => edges(s), { passive: true })
  fit()
  addEventListener('resize', fit)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.pan-btn')
    if (!b) return
    const s = b.closest('.canvas').querySelector('.canvas-scroll')
    s.scrollBy({ left: Number(b.dataset.pan) * s.clientWidth * 0.7, behavior: reduced() ? 'auto' : 'smooth' })
  })
  let drag = null
  let dragged = false
  document.addEventListener('pointerdown', (e) => {
    dragged = false
    const s = e.target.closest('.canvas-scroll')
    if (!s || e.pointerType !== 'mouse' || e.button !== 0 || s.scrollWidth <= s.clientWidth) return
    drag = { s, x: e.clientX, left: s.scrollLeft, id: e.pointerId }
  })
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const dx = e.clientX - drag.x
    if (!dragged && Math.abs(dx) < 5) return
    if (!dragged) {
      dragged = true
      drag.s.classList.add('dragging')
      drag.s.setPointerCapture(e.pointerId)
    }
    drag.s.scrollLeft = drag.left - dx
  })
  const release = () => {
    if (drag) drag.s.classList.remove('dragging')
    drag = null
  }
  document.addEventListener('pointerup', release)
  document.addEventListener('pointercancel', release)
  // The click that ends a drag is not a click on a step.
  document.addEventListener(
    'click',
    (e) => {
      if (!dragged) return
      dragged = false
      e.preventDefault()
      e.stopPropagation()
    },
    true,
  )
})()
