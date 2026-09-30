// The build plan's behaviour (public/build-plan.html), inlined by
// lib/buildPlan/render.ts. Plain browser JS, no libraries (spec §4.3).
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

  // The section bar marks the section being read.
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
  const nodes = JSON.parse(document.getElementById('plan-nodes').textContent)
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

  // A dot runs each workflow's main path while it is on screen.
  const run = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('playing', e.isIntersecting && !reduced())
  })
  for (const c of document.querySelectorAll('.canvas[data-run]')) run.observe(c)

  // A diagram wider than its frame says so.
  const fit = () => {
    for (const s of document.querySelectorAll('.canvas-scroll')) s.closest('.canvas').toggleAttribute('data-overflow', s.scrollWidth > s.clientWidth + 1)
  }
  fit()
  addEventListener('resize', fit)

  // Test rows stay ticked in this browser; blocked storage keeps them for this visit.
  const KEY = 'trusted-mover-plan-tests'
  let ticked = {}
  try {
    ticked = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    ticked = {}
  }
  const boxes = [...document.querySelectorAll('.tests input[type=checkbox]')]
  const count = document.getElementById('tests-count')
  const show = () => {
    let n = 0
    for (const b of boxes) {
      b.checked = !!ticked[b.value]
      b.closest('tr').classList.toggle('done', b.checked)
      if (b.checked) n++
    }
    count.textContent = `${n} of ${boxes.length} passed`
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ticked))
    } catch {
      /* storage blocked: the ticks last for this visit */
    }
  }
  for (const b of boxes)
    b.addEventListener('change', () => {
      if (b.checked) ticked[b.value] = true
      else delete ticked[b.value]
      save()
      show()
    })
  document.getElementById('tests-reset').addEventListener('click', () => {
    ticked = {}
    save()
    show()
  })
  show()
})()
