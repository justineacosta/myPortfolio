import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { endToEnd as E2E, KIND_TYPES, type EndToEnd, type StepKind } from '../../data/endToEnd.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { livelyCss } from '../brand/lively.ts'
import { contourJs, backdropHtml, glossaryLogo, logoBadges, logoSheet, revealJs, toolByName, toolStrip, toolTemplates, toolsUsed, themeHeadJs } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { iconSvg } from './icons.ts'
import { layoutGraph } from './layout.ts'
import { e2eCss } from './styles.ts'

/** Where the page is served (public/end-to-end.html). */
export const PAGE_PATH = '/end-to-end.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const anchor = (lane: string) => `lane-${lane.toLowerCase()}`
/** Each kind wears one of the build plan's step looks. */
const LOOK: Record<StepKind, string> = { trigger: 'trigger', step: 'action', ai: 'ai', decision: 'branch', gate: 'approve', agent: 'ai', end: 'end' }
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const AUTO = () => `<span class="badge-auto">${iconSvg('GearSix', 12)}</span>`

function hero(g: EndToEnd, index: NodeIndex, used: ToolId[]) {
  const sample: Record<string, string> = {
    cable: '<span class="line"></span>',
    signal: '<span class="line line-signal"></span>',
    loop: '<span class="line line-loop"></span>',
    gate: LOCK(),
    auto: AUTO(),
  }
  const legend = g.legend
    .map((k) => {
      index[`key:${k.id}`] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="key:${esc(k.id)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${sample[k.id]}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p>${toolStrip(used)}<ul class="legend" aria-label="How to read the graph">${legend}</ul></header>`
}

/** The whole graph in one frame: lane bands, cables in SVG, their labels, ball templates, and the steps as buttons. */
function graph(g: EndToEnd, index: NodeIndex) {
  const l = layoutGraph(g)
  const byId = new Map(g.steps.map((s) => [s.id, s]))
  for (const s of g.steps) index[s.id] = { label: s.label, type: `${KIND_TYPES[s.kind]}${s.enforced ? ' · RUNS ON ITS OWN' : ''}`, what: s.what, settings: [], ...(s.tools ? { tools: s.tools } : {}) }
  const entered = new Set(g.cables.map((c) => c.to))
  const left = new Set(g.cables.map((c) => c.from))
  const bands = g.lanes
    .map((lane, i) => {
      const b = l.lanes[lane.id]
      const items = g.steps
        .filter((s) => s.lane === lane.id)
        .map((s) => {
          const next = g.cables.filter((c) => c.from === s.id).map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
          return `<li>${esc(s.label)} (${esc(s.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
        })
        .join('')
      return `<div class="lane${i % 2 ? ' alt' : ''}" id="${esc(anchor(lane.id))}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"><p class="lane-head"><b>${esc(lane.id)} · ${esc(lane.name)}</b><span>${esc(lane.note)}</span></p><ol class="steps sr-only">${items}</ol></div>`
    })
    .join('')
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'loop' ? ' loop' : ''}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .filter((c) => c.label)
    .map((c) => `<span class="edge-label${c.align === 'center' ? '' : ` ${c.align}`}" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label!)}</span>`)
    .join('')
  // One hidden template ball per route; client.js sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  const buttons = g.steps
    .map((s) => {
      const at = l.nodes[s.id]
      const badges = `${s.n === undefined ? '' : `<span class="badge-n">${s.n}</span>`}${s.enforced ? AUTO() : ''}${s.kind === 'gate' ? LOCK() : ''}`
      return `<button type="button" class="node k-${LOOK[s.kind]}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${badges}${logoBadges(s.tools)}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>`
    })
    .join('')
  return `<figure class="canvas graph" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(g.caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll graph left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll graph right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="The end-to-end graph, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px">${bands}<svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div></figure>`
}

function glossary(g: EndToEnd) {
  const terms = g.glossary.terms.map(([t, m]) => `<div><dt>${glossaryLogo(t)}${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')
  return `<section class="gloss" id="glossary" aria-labelledby="glossary-h"><header class="shead"><span class="kicker">PLAIN ENGLISH</span><h2 id="glossary-h">${esc(g.glossary.title)}</h2><p>${esc(g.glossary.blurb)}</p></header><dl>${terms}</dl></section>`
}

/** The whole End-to-End Workflow page (spec §3–4): one self-contained HTML file. */
export function renderEndToEnd(g: EndToEnd = E2E, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const used = toolsUsed([...g.steps.map((s) => s.tools), ...g.glossary.terms.map(([t]) => { const id = toolByName(t); return id ? [id] : undefined })])
  const top = hero(g, index, used)
  const body = graph(g, index)
  // Git may check the script out with CRLF on Windows; the page is the same everywhere.
  const client = readFileSync(join(process.cwd(), 'lib/endToEnd/client.js'), 'utf8').replace(/\r\n/g, '\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>${themeHeadJs()}</script>
<title>${esc(g.title)}</title>
<meta name="description" content="${esc(g.description)}">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${PAGE_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>${e2eCss(themes)}${livelyCss()}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<nav class="toc" aria-label="Lanes">${g.lanes.map((lane) => `<a href="#${esc(anchor(lane.id))}"><b>${esc(lane.id)}</b> ${esc(lane.name)}</a>`).join('')}</nav>
<main class="page">
${top}
${body}
${glossary(g)}
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close details">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script>${client}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
