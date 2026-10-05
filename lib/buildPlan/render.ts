import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PLATFORMS } from '../../data/automations.ts'
import { KIND_LABELS, KIND_NOTES, plan as PLAN, type NodeKind, type Plan, type Rail, type Workflow } from '../../data/buildPlan.ts'
import { livelyCss } from '../brand/lively.ts'
import { contourJs, backdropHtml, logo, logoBadges, logoSheet, revealJs, toolStrip, toolTemplates, toolsUsed, themeHeadJs, siteBack } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { iconSvg } from './icons.ts'
import { layout } from './layout.ts'
import { pageCss, platformCss, type Themes } from './styles.ts'

/** Where the page is served (public/build-plan.html). */
export const PAGE_PATH = '/build-plan.html'

/** What each clickable item's panel shows: its name, a kind line, what happens there, and any settings. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const slug = (code: string) => code.toLowerCase()
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const card = (title: string, body: string) => `<div class="card"><h3>${esc(title)}</h3>${body}</div>`
const rail = (items: Rail[]) =>
  items.map((r) => `<div><h3>${esc(r.heading)}</h3>${r.body ? `<p>${esc(r.body)}</p>` : ''}${r.list ? list(r.list) : ''}</div>`).join('')

/** The platform chip: its logo and name, or nothing when the workflow names none. */
function platformChip(w: Workflow) {
  const p = w.platform && PLATFORMS[w.platform]
  return p ? `<span class="platform">${logo(p.tool, 14)}${esc(p.name)}</span>` : ''
}

function section(id: string, kicker: string, title: string, blurb: string, side: Rail[], main: string, wide = '', chip = '') {
  return `<section id="${esc(id)}" aria-labelledby="${esc(id)}-h"><header class="shead"><span class="kicker">${esc(kicker)}</span>${chip}<h2 id="${esc(id)}-h">${esc(title)}</h2><p>${esc(blurb)}</p></header><aside class="rail">${rail(side)}</aside><div class="main">${main}</div>${wide}</section>`
}

function hero(p: Plan, index: NodeIndex, used: ToolId[]) {
  const legend = (Object.keys(KIND_LABELS) as NodeKind[])
    .map((k) => {
      index[`key:${k}`] = { label: KIND_LABELS[k], type: 'DIAGRAM KEY', what: KIND_NOTES[k], settings: [] }
      return `<li><button type="button" class="key" data-node="key:${k}" aria-haspopup="dialog" aria-expanded="false"><span class="k-${k}"><span class="node-card"></span></span>${esc(KIND_LABELS[k])}</button></li>`
    })
    .join('')
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(p.home)}</a>${siteBack(p.site)}<span class="kicker">${esc(p.kicker)}</span><h1>${esc(p.heading)}</h1><p class="lede">${esc(p.lede)}</p>${toolStrip(used)}<dl class="meta">${p.meta
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join('')}</dl><ul class="legend" aria-label="Diagram key">${legend}</ul></header>`
}

/** One workflow as an n8n-style canvas: connectors in SVG, nodes as buttons, a run dot, and the steps as a list. */
function canvas(w: Workflow, index: NodeIndex) {
  const l = layout(w)
  const key = (id: string) => `${slug(w.code)}:${id}`
  const byId = new Map(w.nodes.map((n) => [n.id, n]))
  for (const n of w.nodes) index[key(n.id)] = { label: n.label, type: n.type, what: n.what, settings: n.settings, tools: n.tools }
  const entered = new Set(w.edges.map((e) => e.to))
  const left = new Set(w.edges.map((e) => e.from))
  const paths = l.edges.map((e, i) => `<path class="edge" data-edge="${i}" d="${e.d}"/>`).join('')
  // One hidden template ball per route; client.js sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops.map(([id, at]) => [key(id), at]), spans: r.spans }))
  const labels = l.edges
    .filter((e) => e.label)
    .map((e) => `<span class="edge-label" style="left:${e.mid[0]}px;top:${e.mid[1]}px">${esc(e.label!)}</span>`)
    .join('')
  const buttons = w.nodes
    .map((n) => {
      const at = l.nodes[n.id]
      return `<button type="button" class="node k-${n.kind}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key(n.id))}" data-in="${entered.has(n.id) ? 1 : 0}" data-out="${left.has(n.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(n.icon)}${logoBadges(n.tools)}</span><span class="node-label">${esc(n.label)}</span><span class="node-sub">${esc(n.sub)}</span></button>`
    })
    .join('')
  const steps = w.nodes
    .map((n) => {
      const next = w.edges
        .filter((e) => e.from === n.id)
        .map((e) => `${byId.get(e.to)!.label}${e.label ? ` if ${e.label}` : ''}`)
      return `<li>${esc(n.label)} (${esc(KIND_LABELS[n.kind])}, ${esc(n.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<figure class="canvas" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(w.code)} · ${esc(w.title)}${platformChip(w)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll diagram left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll diagram right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(w.code)} diagram, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${steps}</ol></figure>`
}

function workflowSection(w: Workflow, index: NodeIndex) {
  const decisions = w.nodes.filter((n) => n.kind === 'branch').length
  const main = `<div class="ote">${card('Outcome', `<p>${esc(w.outcome)}</p>`)}${card('Trigger', `<p>${esc(w.trigger)}</p>`)}${card('Exits', list(w.exits))}</div>`
  return section(slug(w.code), w.code, w.title, `${w.nodes.length} nodes, ${decisions} ${decisions === 1 ? 'decision' : 'decisions'}.`, [{ heading: 'Watch for', list: w.watch }], main, canvas(w, index), platformChip(w))
}

/** A helper code (TM-H01, OR-H02, …) links to the Helpers section; a workflow code links to its own section. */
const wfLink = (code: string) => `<a href="#${esc(/-H\d+$/.test(code) ? 'helpers' : slug(code))}">${esc(code)}</a>`

function sections(p: Plan, index: NodeIndex) {
  const s = p.start
  const d = p.data
  return [
    { id: 'start', nav: 'Start', html: section('start', '01', s.title, s.blurb, s.rail, `<div class="ote">${card('Outcome', `<p>${esc(s.outcome)}</p>`)}${card('Entry points', `<p>${esc(s.trigger)}</p>`)}${card('Every way a job ends', list(s.exits))}</div>${card('Out of scope', list(s.outOfScope))}`) },
    { id: 'naming', nav: 'Naming', html: section('naming', '02', p.naming.title, p.naming.blurb, p.naming.rail, `<div class="rules">${p.naming.rules.map((r) => `<div class="rule"><h3>${esc(r.name)}</h3><pre class="code"><b>${esc(r.pattern)}</b>\n${r.examples.map(esc).join('\n')}</pre><p>${esc(r.rule)}</p></div>`).join('')}</div>`) },
    { id: 'data', nav: 'Data', html: section('data', '03', d.title, d.blurb, d.rail, `<div class="cards">${d.tables.map((t) => card(t.name, `<p class="fields">${t.fields.map((f) => `<code>${esc(f)}</code>`).join(' ')}</p><p class="note">${esc(t.note)}</p>`)).join('')}</div><h3 class="sub">Job stages</h3><ol class="stages">${[...d.stages, ...d.exitStages].map(([st, what], i) => { index[`stage:${i}`] = { label: st, type: 'JOB STAGE', what, settings: [] }; return `<li${i >= d.stages.length ? ' class="exit"' : ''}><button type="button" class="stage-btn" data-node="stage:${i}" aria-haspopup="dialog" aria-expanded="false">${esc(st)}</button></li>` }).join('')}</ol><div class="table-wrap"><table><thead><tr><th scope="col">Sheets tab</th><th scope="col">What it holds</th></tr></thead><tbody>${d.sheets.map(([t, what]) => `<tr><td>${esc(t)}</td><td>${esc(what)}</td></tr>`).join('')}</tbody></table></div>`) },
    { id: 'triggers', nav: 'Triggers', html: section('triggers', '04', p.triggers.title, p.triggers.blurb, p.triggers.rail, `<div class="table-wrap"><table><thead><tr><th scope="col">Source</th><th scope="col">Event</th><th scope="col">Workflow</th></tr></thead><tbody>${p.triggers.rows.map(([src, ev, wf]) => `<tr><td>${esc(src)}</td><td><code>${esc(ev)}</code></td><td>${wfLink(wf)}</td></tr>`).join('')}</tbody></table></div>`) },
    ...p.workflows.map((w) => ({ id: slug(w.code), nav: w.code, html: workflowSection(w, index) })),
    { id: 'helpers', nav: 'Helpers', html: section('helpers', '05', p.helpers.title, p.helpers.blurb, p.helpers.rail, p.helpers.list.map((h) => `<div class="helper"><h3>${esc(h.code)} · ${esc(h.title)}</h3><p>${esc(h.outcome)}</p>${canvas(h, index)}</div>`).join('')) },
    { id: 'tests', nav: 'Tests', html: section('tests', '06', p.tests.title, p.tests.blurb, p.tests.rail, `<div class="tests-bar"><span id="tests-count" aria-live="polite">0 of ${p.tests.rows.length} passed</span><button type="button" class="btn" id="tests-reset">Reset</button></div><div class="table-wrap"><table class="tests"><thead><tr><th scope="col">Passed</th><th scope="col">ID</th><th scope="col">Workflow</th><th scope="col">Branch</th><th scope="col">Test</th><th scope="col">Expected</th></tr></thead><tbody>${p.tests.rows.map((r) => `<tr><td><input type="checkbox" id="t-${esc(r.id)}" value="${esc(r.id)}" aria-label="Passed: ${esc(r.id)} ${esc(r.branch)}"></td><td><code>${esc(r.id)}</code></td><td>${wfLink(r.workflow)}</td><td>${esc(r.branch)}</td><td>${esc(r.input)}</td><td>${esc(r.expected)}</td></tr>`).join('')}</tbody></table></div>`) },
    { id: 'build', nav: 'Build order', html: section('build', '07', p.build.title, p.build.blurb, p.build.rail, `<ol class="phases">${p.build.phases.map((ph) => `<li class="card"><div class="phase-head"><h3>${esc(ph.name)}</h3></div>${list(ph.tasks)}</li>`).join('')}</ol>`) },
    { id: 'handover', nav: 'Handover', html: section('handover', '08', p.handover.title, p.handover.blurb, p.handover.rail, `<div class="cards">${card('What it does', list(p.handover.does))}${card('What breaks it', list(p.handover.breaks))}${card('Who to call', `<p>${esc(p.handover.call)}</p>`)}${card('Where the logs are', `<p>${esc(p.handover.logs)}</p>`)}</div>`) },
  ]
}

/** The whole build plan page (spec §3–4): one self-contained HTML file. */
export function renderPlan(p: Plan = PLAN, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const parts = sections(p, index)
  const all = [...p.workflows, ...p.helpers.list]
  const platforms = all.flatMap((w) => (w.platform ? [PLATFORMS[w.platform].tool] : []))
  const used = toolsUsed([...all.flatMap((w) => w.nodes.map((n) => n.tools)), platforms])
  // Git may check the script out with CRLF on Windows; the page is the same everywhere.
  const client = readFileSync(join(process.cwd(), 'lib/buildPlan/client.js'), 'utf8').replace(/\r\n/g, '\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>${themeHeadJs()}</script>
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${p.site?.page ?? PAGE_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>${pageCss(themes)}${livelyCss()}${platforms.length ? platformCss : ''}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<nav class="toc" aria-label="Sections">${parts.map((s) => `<a href="#${esc(s.id)}">${esc(s.nav)}</a>`).join('')}</nav>
<main class="page">
${hero(p, index, used)}
${parts.map((s) => s.html).join('\n')}
</main>
<footer class="foot"><span>${esc(p.footer.note)}</span><a href="/" target="_top">${esc(p.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close settings">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="plan-nodes">${safeJson(index)}</script>
<script>${client}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
