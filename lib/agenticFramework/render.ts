import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { agenticFramework as AF, KIND_TYPES, type AgenticFramework, type Card, type SectionId, type Stage, type StepKind } from '../../data/agenticFramework.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutLoop } from './layout.ts'
import { afCss } from './styles.ts'

/** Where the page is served (public/agentic-framework.html). */
export const PAGE_PATH = '/agentic-framework.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
/** Each kind wears one of the build plan's step looks. */
const LOOK: Record<StepKind, string> = { start: 'trigger', step: 'action', gate: 'approve', end: 'end' }
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const tagClass = (s: Stage) => `t-${s.toLowerCase().replace(/ /g, '-')}`

function section(g: AgenticFramework, id: SectionId, body: string) {
  const s = g.sections.find((x) => x.id === id)!
  return `<section id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h"><header class="shead"><span class="kicker">${esc(s.kicker)}</span><h2 id="${esc(s.id)}-h">${esc(s.title)}</h2><p>${esc(s.blurb)}</p></header>${body}</section>`
}

const tiles = (list: Card[]) =>
  `<ul class="tiles">${list
    .map((c) => `<li class="tile"><span class="tile-top"><span class="tile-icon" aria-hidden="true">${iconSvg(c.icon, 18)}</span><span class="tile-mark">${esc(c.mark)}</span></span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.note ? `<span class="tile-note">${esc(c.note)}</span>` : ''}</li>`)
    .join('')}</ul>`

function hero(g: AgenticFramework) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p></header>`
}

function jobs(g: AgenticFramework) {
  const cols = g.jobs.columns.map((c) => `<div class="job"><h3>${esc(c.title)}</h3><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')
  return `<div class="jobs">${cols}</div><p class="jobs-line">${esc(g.jobs.line)}</p>`
}

/** The live loop: legend, then one frame with cables in SVG, their labels, ball templates, steps and rule pins as buttons. */
function loop(g: AgenticFramework, index: NodeIndex) {
  const { steps, cables, legend, caption } = g.loop
  const l = layoutLoop(g.loop)
  const byId = new Map(steps.map((s) => [s.id, s]))
  const rules = new Map(g.rules.map((r) => [r.mark, r]))
  for (const s of steps) index[s.id] = { label: s.label, type: KIND_TYPES[s.kind], what: s.what, settings: [] }
  const sample: Record<string, string> = {
    cable: '<span class="line"></span>',
    signal: '<span class="line line-signal"></span>',
    loop: '<span class="line line-loop"></span>',
    gate: LOCK(),
    pin: '<span class="pin-sample">R</span>',
  }
  const keys = legend
    .map((k) => {
      index[`key:${k.id}`] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="key:${esc(k.id)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${sample[k.id]}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  const entered = new Set(cables.map((c) => c.to))
  const left = new Set(cables.map((c) => c.from))
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'loop' ? ' loop' : ''}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .filter((c) => c.label)
    .map((c) => `<span class="edge-label" aria-hidden="true" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label!)}</span>`)
    .join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  // A pin sits beside its step, never inside it (a button may not hold a
  // button), and straight after it, so Tab reaches a step and then its rule.
  const pin = (s: (typeof steps)[number]) => {
    if (!s.rule) return ''
    const r = rules.get(s.rule)!
    const key = `rule:${r.mark}`
    index[key] = { label: r.title, type: `RULE ${r.mark}`, what: r.text, settings: [] }
    const at = l.pins[s.id]
    return `<button type="button" class="pin" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key)}" aria-label="Rule ${esc(r.mark)}: ${esc(r.title)}" aria-haspopup="dialog" aria-expanded="false">${esc(r.mark)}</button>`
  }
  const buttons = steps
    .map((s) => {
      const at = l.nodes[s.id]
      return `<button type="button" class="node k-${LOOK[s.kind]}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${s.kind === 'gate' ? LOCK() : ''}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>${pin(s)}`
    })
    .join('')
  const read = steps
    .map((s) => {
      const next = cables.filter((c) => c.from === s.id).map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
      return `<li>${esc(s.label)} (${esc(s.sub)})${s.rule ? `, rule ${esc(s.rule)}` : ''}${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<ul class="legend" aria-label="How to read the loop">${keys}</ul><figure class="canvas loop" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll loop left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll loop right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="The loop, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${read}</ol></figure>`
}

function example(g: AgenticFramework) {
  const items = g.example.items
    .map((it, i) => `<li><span class="tl-n">${i + 1}</span><span class="tag ${tagClass(it.stage)}">${esc(it.stage)}</span><p>${esc(it.text)}</p></li>`)
    .join('')
  return `<ol class="timeline">${items}</ol><a class="see" href="${esc(g.example.link.href)}" target="_top">${esc(g.example.link.label)}</a>`
}

const glossary = (g: AgenticFramework) => `<dl class="gl">${g.glossary.map(([t, m]) => `<div><dt>${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')}</dl>`

/** The whole Agentic Framework page (spec §3–4): one self-contained HTML file. */
export function renderAgenticFramework(g: AgenticFramework = AF, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const body = [
    section(g, 'glance', tiles(g.stages)),
    section(g, 'jobs', jobs(g)),
    section(g, 'tools', tiles(g.tools)),
    section(g, 'rules', tiles(g.rules)),
    section(g, 'loop', loop(g, index)),
    section(g, 'example', example(g)),
    section(g, 'habits', `${tiles(g.habits)}<p class="closing">${esc(g.closing)}</p>`),
    section(g, 'glossary', glossary(g)),
  ].join('\n')
  // End-to-End's client, as it is (read-only). Git may check it out with CRLF on Windows.
  const client = readFileSync(join(process.cwd(), 'lib/endToEnd/client.js'), 'utf8').replace(/\r\n/g, '\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
<style>${afCss(themes)}</style>
</head>
<body>
<nav class="toc" aria-label="Sections">${g.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.chip)}</a>`).join('')}</nav>
<main class="page">
${hero(g)}
${body}
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close details">×</button></div>
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script>${client}</script>
</body>
</html>
`
}
