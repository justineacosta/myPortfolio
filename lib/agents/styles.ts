import { afCss } from '../agenticFramework/styles.ts'
import type { Themes } from '../buildPlan/styles.ts'

/**
 * The agents page’s CSS (spec 2026-10-01-agents-page §4): the Agentic
 * Framework’s look (imported as it is, never edited), plus the sample note,
 * logo pins, branch diamonds, the dashed index, Show its route’s lighting
 * and caption bar, and the build cards.
 */
export function agentsCss(themes: Themes): string {
  return `${afCss(themes)}
.sample-note{display:flex;align-items:center;gap:8px;max-width:62ch;font-size:.875rem;color:var(--ink3)}
.sample-note svg{flex:none;color:var(--accent)}
.legend .line-index{border-top:2px dashed var(--ink3)}
.legend .badge-branch{position:static;display:inline-block;margin:0 3px}
.edge.index{stroke:var(--ink3);stroke-dasharray:3 5}
.badge-branch{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;transform:rotate(45deg);border:1.5px solid var(--k,var(--accent));background:var(--s0)}
.pin{border-color:var(--b2);background:var(--s0);color:var(--ink2)}
.pin:hover,.pin[aria-expanded=true]{border-color:var(--accent);background:var(--s2);color:var(--accent)}
.pin-sample{border-color:var(--b2)}
.canvas :is(.node,.pin,.edge,.edge-label){transition:opacity .3s ease}
.canvas[data-focus] :is(.node,.pin,.edge-label):not(.on-route){opacity:.28}
.canvas[data-focus] .edge:not(.on-route){opacity:.2}
.canvas[data-focus] .edge.on-route{stroke:var(--accent)}
.canvas[data-focus] .node.on-route .node-card{border-color:var(--accent)}
.focus-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 12px;padding:10px 14px;border-radius:12px;border:1px solid var(--washB);background:var(--wash)}
.focus-bar:not(.on){position:absolute;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip-path:inset(50%);border:0}
.focus-text{flex:1 1 260px;min-width:0;margin:0;font-size:.875rem;color:var(--ink)}
.focus-clear,.route-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--b2);background:var(--s0);font:inherit;font-size:.8125rem;font-weight:500;color:var(--ink);cursor:pointer}
.focus-clear:hover,.route-btn:hover{border-color:var(--accent);color:var(--accent)}
.route-btn{align-self:flex-start}
.route-btn[aria-pressed=true]{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.builds-kind{font-family:var(--mono);font-size:.6875rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.build h4{margin:0;font-size:1rem;letter-spacing:-.01em}
.sample{font-family:var(--mono);font-size:.5625rem;letter-spacing:.14em;color:var(--accent)}
.build .build-for{margin:0;font-family:var(--mono);font-size:.6875rem;letter-spacing:.04em;color:var(--ink3)}
.build-example{display:flex;flex-direction:column;gap:6px;margin:2px 0 0;padding:10px 12px;border-radius:10px;border:1px solid var(--b1);background:var(--s0)}
.build-example div{display:flex;flex-direction:column;gap:2px}
.build-example dt{font-family:var(--mono);font-size:.5625rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.build-example dd{margin:0;font-size:.8125rem;color:var(--ink2)}
.build-logos{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:4px}
@media (prefers-reduced-motion:reduce){.canvas :is(.node,.pin,.edge,.edge-label){transition:none}}
:root[data-a11y-motion=true] .canvas :is(.node,.pin,.edge,.edge-label){transition:none}
@media print{.route-btn,.focus-bar{display:none}}
`
}
