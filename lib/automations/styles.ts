import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The Automations page's CSS (plan 2026-10-01-automations-flows §0.3): the
 * Build plan's base, plus the sample note, the flow tabs, and the Make and
 * Zapier looks. n8n is the base look as it is.
 */
export function automationsCss(themes: Themes): string {
  return `${pageCss(themes)}
.sample-note{display:flex;align-items:center;gap:8px;max-width:62ch;font-size:.875rem;color:var(--ink3)}
.sample-note svg{flex:none;color:var(--accent)}
.flows{display:flex;flex-direction:column;gap:18px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;padding:2px}
.tab{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 14px;border-radius:14px;border:1px solid var(--b1);background:var(--s1);color:var(--ink2);font:inherit;text-align:left;cursor:pointer;transition:border-color .2s,background-color .2s}
.tab:hover{border-color:var(--b2);color:var(--ink)}
.tab[aria-selected=true]{border-color:var(--accent);background:var(--wash);color:var(--ink)}
.tab-site{font-size:.875rem;font-weight:600}
.platform{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:.625rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.flow{display:flex;flex-direction:column;gap:14px;scroll-margin-top:16px}
.flow[hidden]{display:none}
.flow:focus-visible{outline-offset:6px;border-radius:12px}
.flow-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 20px}
.outcome{flex:1 1 320px;min-width:0;max-width:62ch;color:var(--ink2)}
.site-link{flex:none;font-size:.875rem;font-weight:500;text-decoration:none}
.site-link:hover{text-decoration:underline}
.p-make .node-card,.p-make .k-trigger .node-card{border-radius:50%}
.p-make .edge{stroke-dasharray:1 7;stroke-linecap:round;stroke-width:2.4}
.p-make .k-branch .node-card{box-shadow:0 0 0 5px var(--s0),0 0 0 6.5px var(--b2)}
.p-zapier .node{width:auto;display:grid;grid-template-columns:56px 200px;grid-template-rows:auto auto;column-gap:14px;row-gap:2px;align-items:center;text-align:left}
.p-zapier .node-card{grid-row:1/3}
.p-zapier .node-label,.p-zapier .node-sub{width:auto}
.p-zapier .node-label{align-self:end}
.p-zapier .node-sub{align-self:start;margin-top:0}
.p-zapier .k-trigger .node-card{border-radius:14px}
.p-zapier .node-card::before,.p-zapier .node-card::after{left:50%;right:auto;margin:0 0 0 -4px}
.p-zapier .node-card::before{top:-5px}
.p-zapier .node-card::after{top:auto;bottom:-5px}
.node-n{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-right:6px;padding:0 4px;border-radius:999px;background:var(--accent);color:var(--onAccent);font-family:var(--mono);font-size:.625rem;font-weight:500;vertical-align:1px}
@media (prefers-reduced-motion:reduce){.tab{transition:none}}
:root[data-a11y-motion=true] .tab{transition:none}
@media print{.tabs{display:none}.flow[hidden]{display:flex}}
`
}
