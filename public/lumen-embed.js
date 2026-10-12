/*
 * Lumen on the case-study and write-up pages (public/cases/, public/*.html).
 * Those pages are built outside the site's React shell, so this script brings
 * the chat to them: the same launcher tile, and on click the real panel, framed
 * from /lumen with this page's path, so Lumen knows which case is being read.
 * The conversation is the site's own, so it carries over both ways.
 *
 * Inside the Projects page's previews the page is itself framed, and the site
 * already has Lumen: the script does nothing there. Messages with the frame
 * are same-origin only; their names match lib/chat/embed.ts.
 */
;(function () {
  if (window.self !== window.top || document.getElementById('lumen-embed')) return

  var MSG = { open: 'lumen:open', close: 'lumen:close', theme: 'lumen:theme' }
  var LABEL = 'Ask Lumen about Justine’s work'
  var ICON =
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z"/></svg>'

  // The page's own tokens where it has them (the case pages share the site's), with the site's dark values as a fallback.
  var css =
    '#lumen-embed-launcher{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:2147483000;display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:12px;border:1px solid var(--b1,rgba(215,255,224,.075));background:var(--s1,#0A0B0D);color:var(--ink2,#C2CBC5);box-shadow:0 10px 30px -12px rgba(0,0,0,.45);cursor:pointer;transition:transform .25s,border-color .25s,color .25s}' +
    '#lumen-embed-launcher:hover{transform:translateY(-2px);border-color:var(--b2,rgba(215,255,224,.17));color:var(--accent,#D7FFE0)}' +
    '#lumen-embed-launcher[aria-expanded=true]{border-color:var(--accent,#D7FFE0);color:var(--accent,#D7FFE0)}' +
    '#lumen-embed-launcher:focus-visible{outline:2px solid var(--accent,#D7FFE0);outline-offset:2px}' +
    '#lumen-embed-dot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:var(--accent,#D7FFE0);box-shadow:0 0 0 2px var(--s1,#0A0B0D)}' +
    '#lumen-embed{position:fixed;right:20px;bottom:72px;z-index:2147483001;width:400px;height:560px;max-height:calc(100dvh - 92px);border-radius:16px;overflow:hidden;border:1px solid var(--b2,rgba(215,255,224,.17));background:var(--s1,#0A0B0D);box-shadow:0 24px 60px -20px rgba(0,0,0,.55);animation:lumen-embed-rise .22s ease-out}' +
    '#lumen-embed[hidden]{display:none}' +
    '#lumen-embed iframe{display:block;width:100%;height:100%;border:0}' +
    '@keyframes lumen-embed-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '@media (max-width:699px){#lumen-embed{inset:0;width:100%;height:100%;max-height:none;border-radius:0;border:0}}' +
    '@media (prefers-reduced-motion:reduce){#lumen-embed,#lumen-embed-launcher{animation:none;transition:none}#lumen-embed-launcher:hover{transform:none}}'

  var style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  var launcher = document.createElement('button')
  launcher.id = 'lumen-embed-launcher'
  launcher.type = 'button'
  launcher.setAttribute('aria-label', LABEL)
  launcher.setAttribute('aria-expanded', 'false')
  launcher.setAttribute('aria-controls', 'lumen-embed')
  launcher.innerHTML = ICON + '<span id="lumen-embed-dot" aria-hidden="true"></span>'

  var box = document.createElement('div')
  box.id = 'lumen-embed'
  box.hidden = true
  var frame = null

  function send(message) {
    if (frame && frame.contentWindow) frame.contentWindow.postMessage(message, location.origin)
  }
  function theme() {
    var t = document.documentElement.getAttribute('data-theme')
    if (t) send({ type: MSG.theme, theme: t })
  }
  function open() {
    if (!frame) {
      frame = document.createElement('iframe')
      frame.title = 'Lumen, Justine’s portfolio assistant'
      frame.setAttribute('allow', 'clipboard-write')
      frame.src = '/lumen?page=' + encodeURIComponent(location.pathname)
      frame.addEventListener('load', function () {
        theme()
        send({ type: MSG.open })
      })
      box.appendChild(frame)
    } else {
      theme()
      send({ type: MSG.open })
    }
    box.hidden = false
    launcher.setAttribute('aria-expanded', 'true')
    // On phones the panel covers the page, launcher included.
    if (window.matchMedia('(max-width: 699px)').matches) launcher.style.display = 'none'
    frame.focus()
  }
  function close() {
    box.hidden = true
    launcher.setAttribute('aria-expanded', 'false')
    launcher.style.display = ''
    launcher.focus()
  }

  launcher.addEventListener('click', function () {
    if (box.hidden) open()
    else close()
  })
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !frame || e.source !== frame.contentWindow) return
    if (e.data && e.data.type === MSG.close) close()
  })
  // `/` opens Lumen from anywhere you aren't typing, as on the site.
  document.addEventListener('keydown', function (e) {
    var t = e.target
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
    if (e.key !== '/' || !box.hidden || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing) return
    e.preventDefault()
    open()
  })
  // The page's theme switch reaches the panel while it is open.
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  document.body.appendChild(launcher)
  document.body.appendChild(box)
})()
