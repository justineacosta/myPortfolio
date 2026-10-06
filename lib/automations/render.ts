import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { automations as A, KIND_LABELS, PLATFORMS, type Automations, type Flow } from '../../data/automations.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { livelyCss } from '../brand/lively.ts'
import { backdropHtml, contourJs, logo, logoBadges, logoSheet, revealJs, themeHeadJs, toolStrip, toolTemplates, toolsUsed, siteBack } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutFlow } from './layout.ts'
import { automationsCss } from './styles.ts'

/** Where the page is served (public/automations.html). */
export const PAGE_PATH = '/automations.html'

/** What each step's panel shows: its name, a kind line, what it does, then what it reads and why. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const slug = (code: string) => code.toLowerCase()
/** A script file, ready to inline. Git may check it out with CRLF on Windows. */
const script = (path: string) => readFileSync(join(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n')

function hero(g: Automations, used: ToolId[]) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a>${siteBack(g.site)}<span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="sample-note"><span aria-hidden="true">${iconSvg('Info', 16)}</span><span>${esc(g.sample)}</span></p>${toolStrip(used)}</header>`
}

/** A tab names its flow's site; on one site's own page every flow shares that site, so it names the flow instead. */
function tab(g: Automations, f: Flow, i: number) {
  const id = slug(f.code)
  const p = PLATFORMS[f.platform]
  return `<button type="button" role="tab" class="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="tab-site">${esc(g.site ? f.title : f.site)}</span><span class="platform">${logo(p.tool, 14)}${esc(p.name)}</span></button>`
}

/** One flow as a canvas: connectors in SVG, steps as buttons, a ball template per route, and the steps as a list. */
function canvas(g: Automations, f: Flow, index: NodeIndex) {
  const l = layoutFlow(f)
  const key = (id: string) => `${slug(f.code)}:${id}`
  const byId = new Map(f.nodes.map((n) => [n.id, n]))
  for (const n of f.nodes)
    index[key(n.id)] = { label: n.label, type: `${PLATFORMS[f.platform].name} · ${KIND_LABELS[n.kind]}`, what: n.what, settings: [[g.panel.reads, n.reads.join(', ')], [g.panel.why, n.why]], ...(n.tools.length ? { tools: n.tools } : {}) }
  const entered = new Set(f.edges.map((e) => e.to))
  const left = new Set(f.edges.map((e) => e.from))
  const paths = l.edges.map((e, i) => `<path class="edge" data-edge="${i}" d="${e.d}"/>`).join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops.map(([id, at]) => [key(id), at]), spans: r.spans }))
  const labels = l.edges
    .filter((e) => e.label)
    .map((e) => `<span class="edge-label" style="left:${e.mid[0]}px;top:${e.mid[1]}px">${esc(e.label!)}</span>`)
    .join('')
  const buttons = f.nodes
    .map((n, i) => {
      const at = l.nodes[n.id]
      const step = f.platform === 'zapier' ? `<span class="node-n" aria-hidden="true">${i + 1}</span>` : ''
      return `<button type="button" class="node k-${n.kind}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key(n.id))}" data-in="${entered.has(n.id) ? 1 : 0}" data-out="${left.has(n.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(n.icon)}${logoBadges(n.tools)}</span><span class="node-label">${step}${esc(n.label)}</span><span class="node-sub">${esc(n.sub)}</span></button>`
    })
    .join('')
  const steps = f.nodes
    .map((n) => {
      const next = f.edges.filter((e) => e.from === n.id).map((e) => `${byId.get(e.to)!.label}${e.label ? ` if ${e.label}` : ''}`)
      return `<li>${esc(n.label)} (${esc(KIND_LABELS[n.kind])}, ${esc(n.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  const pans = f.platform === 'zapier' ? '' : ', scrolls sideways'
  return `<figure class="canvas p-${f.platform}" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(f.code)} · ${esc(f.title)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll diagram left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll diagram right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(f.code)} diagram${pans}"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${steps}</ol></figure>`
}

function flowPanel(g: Automations, f: Flow, i: number, index: NodeIndex) {
  const id = slug(f.code)
  return `<section id="${id}" class="flow" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0"${i ? ' hidden' : ''}><div class="flow-head"><p class="outcome">${esc(f.outcome)}</p><a class="site-link" href="${esc(f.href)}" target="_blank" rel="noopener">${esc(g.seeSite)} ↗<span class="sr-only"> (${esc(f.site)}, opens in a new tab)</span></a></div>${canvas(g, f, index)}</section>`
}

/** The whole Automations page (plan §0.3): one self-contained HTML file. */
export function renderAutomations(g: Automations = A, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const used = toolsUsed([g.flows.map((f) => PLATFORMS[f.platform].tool), ...g.flows.flatMap((f) => f.nodes.map((n) => n.tools))])
  const panels = g.flows.map((f, i) => flowPanel(g, f, i, index)).join('')
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
<link rel="canonical" href="${g.site?.page ?? PAGE_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>${automationsCss(themes)}${livelyCss()}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<main class="page">
${hero(g, used)}
<div class="flows"><div class="tabs" role="tablist" aria-label="${esc(g.tabsLabel)}">${g.flows.map((f, i) => tab(g, f, i)).join('')}</div>${panels}</div>
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="${esc(g.panel.close)}">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script>${script('lib/endToEnd/client.js')}</script>
<script>${script('lib/automations/tabs.js')}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
