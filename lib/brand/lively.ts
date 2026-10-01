import { TOOLS, type ToolId } from './tools.ts'

/** Each tinted step look's colour, per theme (spec 2026-10-01-lively-pages §5.1). Each reaches 3:1 on its tinted card (tests/brand-lively.test.ts). */
export const KINDS = {
  dark: { trigger: '#F5B041', ai: '#B79CFF', branch: '#7EB6FF', helper: '#5EEAD4' },
  light: { trigger: '#B45309', ai: '#6D28D9', branch: '#1D4ED8', helper: '#0F766E' },
} as const

/** The hero glow’s strength, in percent, per theme. Light keeps the quietest hero text within 5% of its contrast (tests/brand-lively.test.ts). */
export const HALO = { dark: 22, light: 4 } as const

const kinds = (t: Record<string, string>) => Object.entries(t).map(([k, v]) => `--k-${k}:${v}`).join(';')
const DARK = `${kinds(KINDS.dark)};--halo:${HALO.dark}%;--logo-light:none;--logo-dark:inline`
const LIGHT = `${kinds(KINDS.light)};--halo:${HALO.light}%;--logo-light:inline;--logo-dark:none`
const TINTED = ':is(.k-trigger,.k-ai,.k-branch,.k-helper) .node-card'
const HC = ':root[data-a11y-contrast=true]'
const STILL = ':root[data-a11y-motion=true]'

/**
 * The shared lively layer (spec 2026-10-01-lively-pages §4–6), added after a
 * page's own CSS so it wins ties. Its theme blocks mirror pageCss: dark first,
 * the device theme when the page is opened alone, the site's data-theme inside
 * its dialog, and light in print. `glow` names the two tools whose colours
 * tint the hero.
 */
export function livelyCss(glow: [ToolId, ToolId]): string {
  return `
:root{${DARK};--halo-a:${TOOLS[glow[0]].brand};--halo-b:${TOOLS[glow[1]].brand}}
@media (prefers-color-scheme: light){:root:not([data-theme=dark]){${LIGHT}}}
:root[data-theme=light]{${LIGHT}}
:root[data-theme=dark]{${DARK}}
.k-trigger{--k:var(--k-trigger)}
.k-ai{--k:var(--k-ai)}
.k-branch{--k:var(--k-branch)}
.k-helper{--k:var(--k-helper)}
${TINTED}{border-color:color-mix(in srgb,var(--k) 45%,var(--b2));background:color-mix(in srgb,var(--k) 12%,var(--s2));color:var(--k)}
${HC} :is(.k-trigger,.k-helper) .node-card{border-color:var(--b2);background:var(--s2);color:var(--ink2)}
${HC} .k-branch .node-card{border-color:var(--b2);background:var(--s2);color:var(--ink)}
${HC} .k-ai .node-card{border-color:var(--accent);background:var(--wash);color:var(--accent)}
${HC} :is(.node.lit,.node:hover) .node-card{border-color:var(--accent)}
.logo{display:inline-block;flex:none;vertical-align:middle}
.logo.mono{color:var(--ink)}
.logo-light{display:var(--logo-light)}
.logo-dark{display:var(--logo-dark)}
.logo-badges{position:absolute;top:-8px;right:-8px;display:flex}
.logo-badge{position:relative;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);transition:box-shadow .35s ease}
.logo-badge+.logo-badge{margin-left:-8px}
.logo-badge:first-child{z-index:1}
.node.lit .logo-badge{box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 30%,transparent),0 0 14px -2px var(--brand);transition-duration:.08s}
.tools-strip{display:flex;flex-direction:column;gap:8px}
.tools-strip-label{font-family:var(--mono);font-size:.625rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.tools-strip ul{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.tool-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 8px;border-radius:999px;border:1px solid var(--b1);background:var(--s1);font-size:.8125rem;color:var(--ink2)}
.ptools{float:left;display:flex;flex-wrap:wrap;gap:4px 10px;max-width:calc(100% - 36px);margin:0 8px 4px 0}
.ptools[hidden]{display:none}
.panel .ptype{padding-right:36px}
.panel h3{clear:left}
.ptool{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:500;color:var(--ink2)}
.gl-logo{display:inline-flex;margin-right:6px;vertical-align:-2px}
.tile,.card,.tool-chip{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
:root:not([data-a11y-motion=true]) :is(.tile,.card,.tool-chip):hover{transform:translateY(-2px);border-color:var(--b2);box-shadow:0 10px 24px -14px color-mix(in srgb,var(--ink) 40%,transparent)}
:root:not([data-a11y-motion=true]) .node:hover .node-card{transform:translateY(-2px)}
:root:not([data-a11y-motion=true]) .node:not(.lit,.k-helper):hover .node-card{box-shadow:0 10px 20px -12px color-mix(in srgb,var(--k,var(--accent)) 70%,transparent)}
}
.hero{position:relative;isolation:isolate}
.hero::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:-96px;height:440px;pointer-events:none;background:radial-gradient(17% 35% at 30% 45%,color-mix(in srgb,var(--halo-a) var(--halo),transparent),transparent),radial-gradient(19% 32% at 68% 40%,color-mix(in srgb,var(--halo-b) var(--halo),transparent),transparent);background-size:115% 115%;background-position:0% 0%;animation:halo 20s ease-in-out infinite alternate}
@keyframes halo{to{background-position:100% 60%}}
${HC} .hero::before{display:none}
.reveal-on [data-reveal]{transition:opacity .6s ease,transform .6s ease}
.reveal-on [data-reveal]:not(.in){opacity:0;transform:translateY(12px)}
${STILL} [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}
${STILL} .hero::before{animation:none}
@media (prefers-reduced-motion: reduce){.hero::before{animation:none}[data-reveal]{opacity:1!important;transform:none!important}}
@media print{
:root,:root[data-theme]{${LIGHT}}
.hero::before{display:none}
[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}
.logo,.logo-badge,.tool-chip,${TINTED}{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`
}
