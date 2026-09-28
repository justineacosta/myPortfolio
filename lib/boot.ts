import { A11Y_KEY, PERF_KEY, THEME_KEY } from './storage-keys'

/** The page is handed back after this long if the intro never claims the run (JS slow or broken). */
export const INTRO_FAILSAFE_MS = 9000

/**
 * Runs inline in <head> before first paint, so the page is never drawn in the
 * wrong theme, a downgraded visitor never sees the expensive layers flash, and
 * a11y switches apply from the first frame. Plain ES5, no imports.
 *
 * Theme rule (spec §7): a stored explicit choice wins, otherwise follow the
 * device. Kraft's :root is the dark palette, so dark is the fallback.
 *
 * Intro rule (spec §8): a full load of "/" with motion allowed holds the page
 * (data-intro, data-intro-head) for components/shell/IntroOverlay.tsx. Client
 * navigation never runs this script, so returning to Home never replays it.
 * It also makes Home's scroll restoration manual, and leaves it so: the mode is
 * stored on the history entry, so it must already be manual when the visitor
 * reloads a scrolled Home, or the browser scrolls it back down mid-intro. The
 * shell resets scroll on every route change anyway (NavigationProvider).
 */
export const bootScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}var light=false;try{light=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)}catch(e){}d.setAttribute('data-theme',t==='light'||t==='dark'?t:(light?'light':'dark'));try{var p=sessionStorage.getItem(${JSON.stringify(PERF_KEY)});if(p==='mid'||p==='low')d.setAttribute('data-perf',p)}catch(e){}try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_KEY)})||'null');if(a){if(a.text==='lg'||a.text==='xl')d.setAttribute('data-a11y-text',a.text);if(a.contrast)d.setAttribute('data-a11y-contrast','true');if(a.motion)d.setAttribute('data-a11y-motion','true');if(a.links)d.setAttribute('data-a11y-links','true')}}catch(e){}try{var rm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);if(location.pathname==='/'&&!rm&&d.getAttribute('data-a11y-motion')!=='true'){d.setAttribute('data-intro','');d.setAttribute('data-intro-head','');try{history.scrollRestoration='manual'}catch(e){}setTimeout(function(){if(d.hasAttribute('data-intro-live'))return;d.removeAttribute('data-intro');d.removeAttribute('data-intro-head')},${INTRO_FAILSAFE_MS})}}catch(e){}})();`
