// Light unless the visitor chose dark (spec 2026-10-01-light-backdrop §3.2). Runs first in <head>, before the
// page draws. On its own, the page reads the portfolio's saved choice. Inside the site's dialog it starts in
// the site's theme (dark unless the site says light, the site's own rule), which the page script then mirrors
// live, so there is no flash.
;(() => {
  let dark = false
  try {
    dark = window.parent !== window ? window.parent.document.documentElement.dataset.theme !== 'light' : localStorage.getItem('kraft-theme') === 'dark'
  } catch {
    dark = false
  }
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  // On its own, carry the site's per-tab performance setting (lib/perf.ts), as the site's boot script does,
  // so a device the site stepped down keeps the backdrop still. Inside the dialog, client.js mirrors it.
  if (window.parent !== window) return
  try {
    const perf = sessionStorage.getItem('kraft-perf')
    if (perf === 'mid' || perf === 'low') document.documentElement.dataset.perf = perf
  } catch {
    /* storage blocked: the page runs at full detail */
  }
})()
