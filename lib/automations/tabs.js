// The Automations page's tabs (public/automations.html), inlined by
// lib/automations/render.ts after the End-to-End client. One flow shows at a
// time. Arrow keys, Home and End move between tabs (WAI-ARIA tabs, automatic
// activation). A #hp-01 address opens that flow; a switch updates the address
// without adding history, so Back still closes the portfolio's window.
;(() => {
  const tabs = [...document.querySelectorAll('[role=tab]')]
  const panel = document.getElementById('node-panel')
  const code = (t) => t.getAttribute('aria-controls')
  const select = (tab, focus) => {
    // A step's panel belongs to the flow on show.
    if (panel.matches(':popover-open')) panel.hidePopover()
    for (const t of tabs) {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      document.getElementById(code(t)).hidden = !on
    }
    if (focus) tab.focus()
    // The client measures each diagram's pan arrows and fades on resize; a flow that was hidden had no size.
    dispatchEvent(new Event('resize'))
  }
  const go = (tab, focus) => {
    select(tab, focus)
    history.replaceState(null, '', `#${code(tab)}`)
  }
  for (const t of tabs) t.addEventListener('click', () => go(t, false))
  document.querySelector('[role=tablist]').addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement)
    if (i < 0) return
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    go(tabs[(to + tabs.length) % tabs.length], true)
  })
  const fromHash = () => {
    const t = tabs.find((x) => `#${code(x)}` === location.hash)
    if (t) select(t, false)
  }
  fromHash()
  addEventListener('hashchange', fromHash)
})()
