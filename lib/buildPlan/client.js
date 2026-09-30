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

  // A step shows its settings in a small panel, like n8n's side panel.
  const nodes = JSON.parse(document.getElementById('plan-nodes').textContent)
  const closeBtn = panel.querySelector('[data-p=close]')
  let opener = null
  panel.addEventListener('toggle', (e) => {
    if (e.newState !== 'closed' || !opener) return
    const back = opener
    opener = null
    back.focus({ preventScroll: true })
  })
  closeBtn.addEventListener('click', () => panel.hidePopover())
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.node[data-node]')
    if (!btn) return
    const n = nodes[btn.dataset.node]
    if (!n) return
    if (panel.matches(':popover-open')) {
      opener = null
      panel.hidePopover()
    }
    panel.querySelector('[data-p=type]').textContent = n.type
    panel.querySelector('[data-p=label]').textContent = n.label
    panel.querySelector('dl').replaceChildren(
      ...n.settings.flatMap(([k, v]) => {
        const dt = document.createElement('dt')
        dt.textContent = k
        const dd = document.createElement('dd')
        dd.textContent = v
        return [dt, dd]
      }),
    )
    panel.showPopover()
    const r = btn.getBoundingClientRect()
    const w = panel.offsetWidth
    const h = panel.offsetHeight
    const x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12)
    const below = r.top + 70
    const y = below + h > innerHeight - 12 ? Math.max(12, r.top - h - 10) : below
    panel.style.left = `${Math.max(12, x)}px`
    panel.style.top = `${y}px`
    opener = btn
    closeBtn.focus()
  })

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
