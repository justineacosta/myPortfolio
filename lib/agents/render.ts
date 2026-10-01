import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { agents as A, KIND_TYPES, type Agents, type Build, type Diagram, type DiagramId, type LegendId, type SectionId, type Step, type StepKind, type Tile } from '../../data/agents.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { livelyCss } from '../brand/lively.ts'
import { backdropHtml, contourJs, glossaryLogo, logo, logoBadges, logoSheet, revealJs, themeHeadJs, toolByName, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import { TOOLS, type ToolId } from '../brand/tools.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutDiagram, type DiagramLayout } from './layout.ts'
import { agentsCss } from './styles.ts'

/** Where the page is served (public/ai-agents.html). */
export const PAGE_PATH = '/ai-agents.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>
/** What Show its route lights for one build. lib/agents/focus.js reads it. */
export type BuildFocus = { diagram: DiagramId; name: string; caption: string; routes: number[]; nodes: string[]; edges: number[]; pins: string[] }

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
/** Each kind wears one of the build plan's step looks; a plain step Claude runs wears the AI look. */
const LOOK: Partial<Record<StepKind, string>> = { start: 'trigger', branch: 'branch', gate: 'approve', end: 'end' }
const look = (s: Step) => LOOK[s.kind] ?? (s.tools?.includes('claude') ? 'ai' : 'action')
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const DIAMOND = '<span class="badge-branch" aria-hidden="true"></span>'
const SAMPLE: Record<LegendId, () => string> = {
  cable: () => '<span class="line"></span>',
  signal: () => '<span class="line line-signal"></span>',
  loop: () => '<span class="line line-loop"></span>',
  index: () => '<span class="line line-index"></span>',
  branch: () => DIAMOND,
  gate: LOCK,
  pin: () => '<span class="pin-sample"></span>',
}
const NOUN: Record<DiagramId, string> = { rag: 'the RAG diagram', agent: 'the agent diagram' }
/** "SOURCE" → "Source". */
const title = (t: string) => t[0] + t.slice(1).toLowerCase()

function section(g: Agents, id: SectionId, body: string) {
  const s = g.sections.find((x) => x.id === id)!
  return `<section id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h"><header class="shead"><span class="kicker">${esc(s.kicker)}</span><h2 id="${esc(s.id)}-h">${esc(s.title)}</h2><p>${esc(s.blurb)}</p></header>${body}</section>`
}

const tiles = (list: Tile[]) =>
  `<ul class="tiles">${list
    .map((c) => `<li class="tile"><span class="tile-top"><span class="tile-icon" aria-hidden="true">${iconSvg(c.icon, 18)}</span><span class="tile-mark">${esc(c.mark)}</span></span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></li>`)
    .join('')}</ul>`

function hero(g: Agents, used: ToolId[]) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="sample-note"><span aria-hidden="true">${iconSvg('Info', 16)}</span><span>${esc(g.sample)}</span></p>${toolStrip(used)}</header>`
}

/** One live diagram: legend, then a frame with its caption bar, cables, labels, ball templates, steps and their pins. */
function diagram(g: Agents, d: Diagram, l: DiagramLayout, index: NodeIndex) {
  const { steps, cables, legend, caption } = d
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const s of steps) index[s.id] = { label: s.label, type: KIND_TYPES[s.kind], what: s.what, settings: [], ...(s.tools ? { tools: s.tools } : {}) }
  const keys = legend
    .map((k) => {
      const key = `key:${d.id}:${k.id}`
      index[key] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="${esc(key)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${SAMPLE[k.id]()}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  const entered = new Set(cables.map((c) => c.to))
  const left = new Set(cables.map((c) => c.from))
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'flow' ? '' : ` ${c.kind}`}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .map((c, i) => (c.label ? `<span class="edge-label" data-edge="${i}" aria-hidden="true" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label)}</span>` : ''))
    .join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  // A pin sits beside its step, never inside it (a button may not hold a
  // button), and straight after it, so Tab reaches a step and then its pins.
  const pins = (s: Step) =>
    (s.pins ?? [])
      .map((p) => {
        const key = `pin:${s.id}:${p.id}`
        index[key] = { label: p.name, type: s.pinType ?? 'PIN', what: p.what, settings: [], ...(p.tool ? { tools: [p.tool] } : {}) }
        const at = l.pins[`${s.id}:${p.id}`]
        return `<button type="button" class="pin" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key)}" aria-label="${esc(title(s.pinType ?? 'PIN'))}: ${esc(p.name)}" aria-haspopup="dialog" aria-expanded="false">${p.tool ? logo(p.tool, 14) : iconSvg(p.icon!, 13)}</button>`
      })
      .join('')
  const buttons = steps
    .map((s) => {
      const at = l.nodes[s.id]
      return `<button type="button" class="node k-${look(s)}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${s.kind === 'gate' ? LOCK() : ''}${s.kind === 'branch' ? DIAMOND : ''}${logoBadges(s.tools)}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>${pins(s)}`
    })
    .join('')
  const read = steps
    .map((s) => {
      const uses = (s.pins ?? []).map((p) => p.name)
      const next = cables.filter((c) => c.from === s.id && c.kind !== 'index').map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
      return `<li>${esc(s.label)} (${esc(s.sub)})${uses.length ? `, uses ${esc(uses.join(', '))}` : ''}${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<ul class="legend" aria-label="How to read ${NOUN[d.id]}">${keys}</ul><figure class="canvas" data-diagram="${d.id}" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll ${NOUN[d.id]} left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll ${NOUN[d.id]} right">›</button></span></figcaption><div class="focus-bar"><p class="focus-text" role="status"></p><button type="button" class="focus-clear" hidden>${esc(g.buildText.showAll)}</button></div><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(caption)}, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${read}</ol></figure>`
}

/** The steps, cables and pins one build lights: those on its routes, plus the index when both its ends are lit. */
function focusFor(b: Build, d: Diagram, l: DiagramLayout): BuildFocus {
  const routes = b.routes.map((id) => l.routes.findIndex((r) => r.id === id))
  if (routes.includes(-1)) throw new Error(`Build ${b.id} names a route its diagram does not have`)
  const nodes = [...new Set(routes.flatMap((i) => l.routes[i].nodes))]
  const edges = new Set(routes.flatMap((i) => l.routes[i].spans.map(([k]) => k)))
  l.cables.forEach((c, k) => {
    if (c.kind === 'index' && nodes.includes(c.from) && nodes.includes(c.to)) edges.add(k)
  })
  return { diagram: d.id, name: b.name, caption: b.caption, routes, nodes, edges: [...edges].sort((x, y) => x - y), pins: b.pins.map((p) => `pin:${p}`) }
}

function builds(g: Agents) {
  const t = g.buildText
  return (['rag', 'agent'] as const)
    .map(
      (kind) =>
        `<h3 class="builds-kind">${esc(t.groups[kind])}</h3><ul class="tiles builds">${g.builds
          .filter((b) => b.kind === kind)
          .map(
            (b) =>
              `<li class="tile build" id="build-${esc(b.id)}"><span class="tile-top"><span class="sample">${esc(t.sample)}</span><span class="tile-mark">${esc(t.kinds[kind])}</span></span><h4>${esc(b.name)}</h4><p>${esc(b.line)}</p><span class="build-logos" aria-hidden="true">${b.tools.map((id) => logo(id, 18)).join('')}</span><span class="sr-only">${esc(t.tools)}: ${esc(b.tools.map((id) => TOOLS[id].name).join(', '))}</span><button type="button" class="route-btn" data-build="${esc(b.id)}" aria-pressed="false" aria-label="${esc(t.show)}: ${esc(b.name)}"><span aria-hidden="true">${iconSvg('Path', 14)}</span>${esc(t.show)}</button></li>`,
          )
          .join('')}</ul>`,
    )
    .join('')
}

const glossary = (g: Agents) => `<dl class="gl">${g.glossary.map(([term, m]) => `<div><dt>${glossaryLogo(term)}${esc(term)}</dt><dd>${esc(m)}</dd></div>`).join('')}</dl>`

/** The whole AI agents and RAG chatbots page (spec §3–4): one self-contained HTML file. */
export function renderAgents(g: Agents = A, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const steps = [...g.diagrams.rag.steps, ...g.diagrams.agent.steps]
  const used = toolsUsed([
    g.heroTools,
    ...steps.map((s) => s.tools),
    ...steps.flatMap((s) => (s.pins ?? []).map((p) => (p.tool ? [p.tool] : undefined))),
    ...g.builds.map((b) => b.tools),
    ...g.glossary.map(([t]) => {
      const id = toolByName(t)
      return id ? [id] : undefined
    }),
  ])
  const laid = { rag: layoutDiagram(g.diagrams.rag), agent: layoutDiagram(g.diagrams.agent) }
  const focus = Object.fromEntries(g.builds.map((b) => [b.id, focusFor(b, g.diagrams[b.kind], laid[b.kind])]))
  const body = [
    section(g, 'glance', tiles(g.glance)),
    section(g, 'rag', diagram(g, g.diagrams.rag, laid.rag, index)),
    section(g, 'agent', diagram(g, g.diagrams.agent, laid.agent, index)),
    section(g, 'builds', builds(g)),
    section(g, 'guardrails', tiles(g.guardrails)),
    section(g, 'glossary', glossary(g)),
  ].join('\n')
  // End-to-End's client, as it is (read-only). Git may check it out with CRLF on Windows.
  const client = readFileSync(join(process.cwd(), 'lib/endToEnd/client.js'), 'utf8').replace(/\r\n/g, '\n')
  // Show its route. Git may check it out with CRLF on Windows.
  const focusJs = readFileSync(join(process.cwd(), 'lib/agents/focus.js'), 'utf8').replace(/\r\n/g, '\n')
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
<style>${agentsCss(themes)}${livelyCss()}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<nav class="toc" aria-label="Sections">${g.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.chip)}</a>`).join('')}</nav>
<main class="page">
${hero(g, used)}
${body}
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close details">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script type="application/json" id="agent-builds">${safeJson(focus)}</script>
<script>${client}</script>
<script>${focusJs}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
