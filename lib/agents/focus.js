// The agents page's Show its route (spec 2026-10-01-agents-page §4.3),
// inlined by lib/agents/render.ts after End-to-End's client. One build at a
// time: its diagram lights the build's steps, cables and pins, dims the rest,
// and sends balls down its routes only (data-only, read by the client). Plain
// browser JS, no libraries.
;(() => {
  const builds = JSON.parse(document.getElementById('agent-builds').textContent)
  const root = document.documentElement
  const reduced = () => root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches
  const panel = document.getElementById('node-panel')
  let current = null

  const clear = (focusBack) => {
    if (!current) return
    const { fig, btn } = current
    current = null
    fig.removeAttribute('data-focus')
    fig.removeAttribute('data-only')
    for (const el of fig.querySelectorAll('.on-route')) el.classList.remove('on-route')
    const bar = fig.querySelector('.focus-bar')
    bar.classList.remove('on')
    bar.querySelector('.focus-text').textContent = ''
    bar.querySelector('.focus-clear').hidden = true
    btn.setAttribute('aria-pressed', 'false')
    if (focusBack) btn.focus({ preventScroll: true })
  }

  const show = (btn) => {
    const b = builds[btn.dataset.build]
    if (!b) return
    clear(false)
    const fig = document.querySelector(`figure[data-diagram="${b.diagram}"]`)
    fig.setAttribute('data-focus', btn.dataset.build)
    fig.setAttribute('data-only', b.routes.join(','))
    const mark = (sel) => {
      for (const el of fig.querySelectorAll(sel)) el.classList.add('on-route')
    }
    for (const n of b.nodes) mark(`.node[data-node="${CSS.escape(n)}"]`)
    for (const e of b.edges) mark(`[data-edge="${e}"]`)
    for (const p of b.pins) mark(`.pin[data-node="${CSS.escape(p)}"]`)
    // Balls already on other routes finish now, so only this build's routes run.
    for (const ball of fig.querySelectorAll('.run-ball'))
      if (!b.routes.includes(Number(ball.dataset.route))) for (const a of ball.getAnimations()) a.finish()
    const bar = fig.querySelector('.focus-bar')
    bar.classList.add('on')
    bar.querySelector('.focus-text').textContent = `${b.name}: ${b.caption}`
    const all = bar.querySelector('.focus-clear')
    all.hidden = false
    btn.setAttribute('aria-pressed', 'true')
    current = { fig, btn }
    fig.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })
    all.focus({ preventScroll: true })
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-build]')
    if (btn) {
      if (current && current.btn === btn) clear(true)
      else show(btn)
      return
    }
    if (e.target.closest('.focus-clear')) clear(true)
  })

  // Escape closes the innermost thing first: the details panel (the page
  // client's), then a route, then (inside the site) the site's window. This
  // runs before the client's listener, which leaves a handled Escape alone.
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !current || panel.matches(':popover-open')) return
      e.preventDefault()
      clear(true)
    },
    true,
  )
})()
