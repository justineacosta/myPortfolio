/** Kraft's tokens for one theme, as read by lib/tokens.ts. */
export type Themes = {
  dark: Record<string, string>
  light: Record<string, string>
  /** The site's High contrast overrides for each theme (lib/tokens.ts readContrast). */
  contrast: { dark: Record<string, string>; light: Record<string, string> }
}

const KEYS = ['bg', 'frame', 's0', 's1', 's2', 's3', 'chip', 'hover', 'b1', 'b2', 'ink', 'ink2', 'ink3', 'ink4', 'accent', 'onAccent', 'wash', 'washB', 'glow'] as const
const vars = (t: Record<string, string>) => KEYS.map((k) => `--${k}:${t[k]}`).join(';')
const decls = (t: Record<string, string>) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';')

/**
 * The build plan's CSS (spec §4). Dark first, like the site. Inside the
 * portfolio's dialog, client.js copies the site's data-theme, so the
 * [data-theme] blocks win. Opened on its own, the device theme decides.
 */
export function pageCss({ dark, light, contrast }: Themes): string {
  return `
:root{${vars(dark)};color-scheme:dark;--sans:"Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme: light){:root:not([data-theme=dark]){${vars(light)};color-scheme:light}}
:root[data-theme=light]{${vars(light)};color-scheme:light}
:root[data-theme=dark]{${vars(dark)};color-scheme:dark}
:root[data-a11y-contrast=true]:not([data-theme=light]){${decls(contrast.dark)}}
:root[data-a11y-contrast=true][data-theme=light]{${decls(contrast.light)}}
*{box-sizing:border-box}
html{font-size:100%;scroll-behavior:smooth;scroll-padding-top:64px}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:.9375rem;line-height:1.6;-webkit-font-smoothing:antialiased;text-wrap:pretty}
a{color:var(--accent)}
:root[data-a11y-links=true] a{text-decoration:underline}
h1,h2,h3{margin:0;text-wrap:balance}
p{margin:0}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.toc{position:sticky;top:0;z-index:20;display:flex;gap:4px;overflow-x:auto;padding:10px 16px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--b1);scrollbar-width:none}
.toc a{flex:none;padding:6px 11px;border-radius:999px;font-size:.8125rem;color:var(--ink3);text-decoration:none;white-space:nowrap}
.toc a:hover{color:var(--ink)}
.toc a[aria-current=true]{background:var(--wash);color:var(--accent)}
.page{max-width:1100px;margin:0 auto;padding:32px 16px 80px;display:flex;flex-direction:column;gap:72px}
.home{align-self:flex-start;font-size:.8125rem;color:var(--ink3);text-decoration:none}
.home:hover{color:var(--accent)}
:root[data-embedded] .home{display:none}
.kicker{font-family:var(--mono);font-size:.6875rem;letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
.hero{display:flex;flex-direction:column;gap:18px;padding-top:24px}
.hero h1{font-size:clamp(1.9rem,4.6vw,3rem);line-height:1.08;letter-spacing:-.035em;max-width:22ch}
.lede{font-size:1.0625rem;color:var(--ink2);max-width:62ch}
.meta{display:flex;flex-wrap:wrap;gap:10px 28px;margin:0;padding:16px 0;border-block:1px solid var(--b1)}
.meta div{display:flex;flex-direction:column;gap:2px}
.meta dt,.card h3,.rail h3,.sub{font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.card h3,.rail h3,.sub{color:var(--accent)}
.meta dd{margin:0;font-size:.875rem}
.legend{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px 18px;margin:0;padding:0;list-style:none;font-size:.8125rem;color:var(--ink3)}
.key{display:flex;align-items:center;gap:8px;padding:3px 6px;margin:-3px -6px;border:0;border-radius:8px;background:none;color:inherit;font:inherit;cursor:pointer}
.key:hover{color:var(--ink);background:var(--wash)}
section{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:20px 40px;scroll-margin-top:64px}
@media (max-width:820px){section{grid-template-columns:minmax(0,1fr)}}
.shead{grid-column:1/-1;display:flex;flex-direction:column;gap:6px}
.shead h2{font-size:clamp(1.35rem,2.6vw,1.75rem);letter-spacing:-.02em}
.shead p{color:var(--ink3)}
.rail{display:flex;flex-direction:column;gap:16px;font-size:.875rem;color:var(--ink2)}
.rail div{display:flex;flex-direction:column;gap:6px}
.main{min-width:0;display:flex;flex-direction:column;gap:18px}
section>.canvas{grid-column:1/-1}
ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.card{background:var(--s1);border:1px solid var(--b1);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px}
.ote{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:700px){.ote{grid-template-columns:minmax(0,1fr)}}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:22px}
.rule{display:flex;flex-direction:column;gap:8px;min-width:0}
.rule h3{font-size:.9375rem}
.rule p{font-size:.875rem;color:var(--ink2)}
.code{margin:0;padding:14px 16px;border-radius:12px;background:var(--s0);border:1px solid var(--b1);font-family:var(--mono);font-size:.8125rem;line-height:1.7;color:var(--ink2);white-space:pre;overflow-x:auto}
.code b{color:var(--accent);font-weight:500}
code{font-family:var(--mono);font-size:.85em;background:var(--chip);padding:1px 6px;border-radius:6px}
.fields{display:flex;flex-wrap:wrap;gap:6px}
.note{font-size:.8125rem;color:var(--ink3)}
.stages{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.stage{padding:6px 10px;border-radius:9px;border:1px solid var(--b2);background:var(--s2);color:var(--ink);font:inherit;font-size:.8125rem;cursor:pointer}
.stage:hover{border-color:var(--accent)}
.stages .exit .stage{border-style:dashed;color:var(--ink3)}
.table-wrap{overflow-x:auto;border:1px solid var(--b1);border-radius:14px;background:var(--s1)}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th{padding:10px 14px;border-bottom:1px solid var(--b1);font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3);text-align:left}
td{padding:10px 14px;border-bottom:1px solid var(--b1);vertical-align:top}
tr:last-child td{border-bottom:0}
.tests{min-width:760px}
.tests tr.done td{color:var(--ink3)}
.tests input{width:18px;height:18px;accent-color:var(--accent);cursor:pointer}
.tests-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:.75rem;color:var(--ink3)}
.btn{font:inherit;font-size:.8125rem;font-weight:600;padding:8px 12px;border-radius:10px;border:1px solid var(--b2);background:var(--s1);color:var(--ink);cursor:pointer}
.phases{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.phase-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.phase-head h3{font-family:var(--sans);font-size:1rem;letter-spacing:-.01em;text-transform:none;color:var(--ink)}
.helper{display:flex;flex-direction:column;gap:10px}
.helper h3{font-size:1rem}
.helper p{color:var(--ink2);font-size:.875rem}
.canvas{margin:0;display:flex;flex-direction:column;gap:10px;min-width:0}
.canvas figcaption{display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:.6875rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.swipe{display:none}
.canvas[data-overflow] .swipe{display:inline}
.canvas-scroll{overflow-x:auto;border:1px solid var(--b1);border-radius:16px;background-color:var(--s0);background-image:radial-gradient(var(--b2) 1px,transparent 1px);background-size:20px 20px;overscroll-behavior-x:contain}
.stage{position:relative}
.edges{position:absolute;inset:0}
.edge{fill:none;stroke:var(--b2);stroke-width:1.6}
.edge-label{position:absolute;transform:translate(-50%,-50%);padding:1px 6px;border-radius:6px;border:1px solid var(--b1);background:var(--s0);font-family:var(--mono);font-size:.625rem;color:var(--ink2);white-space:nowrap}
.run-dot{position:absolute;left:0;top:0;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash),0 0 14px 2px var(--glow);offset-anchor:50% 50%;offset-rotate:0deg;opacity:0;pointer-events:none}
.canvas.playing .run-dot{opacity:1;animation:run var(--run-s,8s) linear infinite}
@keyframes run{from{offset-distance:0%}to{offset-distance:100%}}
.node{position:absolute;width:56px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0;border:0;background:none;color:var(--ink);font:inherit;text-align:center;cursor:pointer}
.node-card{position:relative;display:grid;place-items:center;width:56px;height:56px;border-radius:14px;border:1.5px solid var(--b2);background:var(--s2);color:var(--ink2);transition:border-color .2s,transform .2s}
.node-card::before,.node-card::after{content:"";position:absolute;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;border:1.5px solid var(--b2);background:var(--s0)}
.node-card::before{left:-5px}
.node-card::after{right:-5px}
.node[data-in="0"] .node-card::before,.node[data-out="0"] .node-card::after{display:none}
.node:hover .node-card{border-color:var(--accent);transform:translateY(-1px)}
.node-label{width:136px;font-size:.75rem;font-weight:600;line-height:1.25}
.node-sub{width:136px;margin-top:-3px;font-family:var(--mono);font-size:.625rem;color:var(--ink3)}
.k-trigger .node-card{border-radius:28px 14px 14px 28px}
.k-ai .node-card{border-color:var(--accent);background:var(--wash);color:var(--accent)}
.k-branch .node-card{color:var(--ink)}
.k-wait .node-card{border-style:dashed}
.k-approve .node-card{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.k-helper .node-card{box-shadow:4px 4px 0 -1.5px var(--s0),4px 4px 0 0 var(--b2)}
.k-end .node-card{background:transparent;color:var(--ink3)}
.legend .node-card{width:18px;height:18px;border-radius:6px}
.legend .node-card::before,.legend .node-card::after{display:none}
.legend .k-trigger .node-card{border-radius:9px 6px 6px 9px}
.legend .k-helper .node-card{box-shadow:2px 2px 0 -1px var(--bg),2px 2px 0 0 var(--b2)}
.steps{margin:0}
.panel{position:fixed;inset:auto;margin:0;width:min(320px,calc(100vw - 24px));padding:16px;border-radius:14px;border:1px solid var(--b2);background:var(--s1);color:var(--ink);box-shadow:0 24px 60px -30px var(--glow)}
.panel h3{font-size:1rem;padding-right:36px}
.ptype{display:block;margin-bottom:4px;font-family:var(--mono);font-size:.6875rem;letter-spacing:.08em;color:var(--accent)}
.pwhat{margin:10px 0 0;font-size:.875rem;line-height:1.55;color:var(--ink)}
.panel dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:12px 0 0;padding-top:12px;border-top:1px solid var(--b1);font-size:.8125rem}
.panel dl[hidden]{display:none}
.panel dt{color:var(--ink3)}
.panel dd{margin:0}
.panel-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:9px;border:1px solid var(--b1);background:var(--s2);color:var(--ink);font-size:1.1rem;line-height:1;cursor:pointer}
.foot a{color:var(--ink2)}
.foot{max-width:1100px;margin:0 auto;padding:24px 16px 48px;border-top:1px solid var(--b1);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:.8125rem;color:var(--ink3)}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}.run-dot{display:none}.node-card{transition:none}}
:root[data-a11y-motion=true]{scroll-behavior:auto}
:root[data-a11y-motion=true] .run-dot{display:none}
:root[data-a11y-motion=true] .node-card{transition:none}
@media print{
:root,:root[data-theme]{${vars(light)};color-scheme:light}
body{background:var(--frame)}
.toc,.run-dot,.panel,.btn,.swipe{display:none!important}
.page{gap:40px;padding-top:0}
section,.canvas,.card,tr{break-inside:avoid}
.canvas-scroll{overflow:visible;border:0;background:none}
.stage{zoom:.62}
.steps.sr-only{position:static;width:auto;height:auto;margin:6px 0 0;overflow:visible;clip:auto;white-space:normal;font-size:.75rem;color:var(--ink2)}
a[href^="http"]::after{content:" (" attr(href) ")";font-size:.75em;color:var(--ink3)}
}
`
}
