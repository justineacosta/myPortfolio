// Scroll-in reveal for the standalone pages (spec 2026-10-01-lively-pages §6).
// Nothing is hidden unless this runs and motion is allowed, so the page is
// whole with JavaScript off, under reduced motion and in print. Whatever is
// on screen at load shows at once. It runs after the page's own script, which
// has already copied the site's motion setting onto <html>.
;(() => {
  const root = document.documentElement
  if (root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        seen.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  for (const el of document.querySelectorAll('.tools-strip,.tiles,.jobs,.timeline,.gl,.gloss dl,.ote,.cards,.rules,.phases,.stages,.closing')) {
    el.setAttribute('data-reveal', '')
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in')
    else seen.observe(el)
  }
  root.classList.add('reveal-on')
})()
