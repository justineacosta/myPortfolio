import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The End-to-End page's CSS: the build plan's look (imported as it is, never
 * edited), plus lanes, badges, the line legend and the glossary (spec §4).
 */
export function e2eCss(themes: Themes): string {
  return `${pageCss(themes)}
.page{max-width:1240px}
.stance{font-weight:600;color:var(--ink)}
.legend .line{display:inline-block;width:26px;border-top:2px solid var(--b2)}
.legend .line-signal{width:10px;height:10px;border:0;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash)}
.legend .line-loop{border-top:2px dashed var(--accent)}
.legend .line-gate,.legend .line-auto{position:static;width:auto;border:0}
.lane{position:absolute;border-radius:18px;background:color-mix(in srgb,var(--s1) 72%,transparent)}
.lane.alt{background:color-mix(in srgb,var(--accent) 6%,var(--s0))}
.lane-head{position:sticky;left:12px;z-index:2;display:inline-flex;align-items:baseline;gap:10px;margin:12px 0 0 12px;padding:5px 12px;border-radius:999px;border:1px solid var(--b1);background:var(--s0);white-space:nowrap}
.lane-head b{font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.lane-head span{font-size:.75rem;color:var(--ink3)}
@media (max-width:560px){.lane-head span{display:none}}
.edge.loop{stroke:color-mix(in srgb,var(--accent) 55%,var(--b2));stroke-dasharray:5 5}
.edge.loop.lit{stroke:var(--accent)}
.edge-label.start{transform:translate(0,-50%)}
.edge-label.end{transform:translate(-100%,-50%)}
.badge-n{position:absolute;top:-8px;left:-8px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--ink);color:var(--bg);font-family:var(--mono);font-size:.625rem;font-weight:500}
.badge-auto,.badge-lock{position:absolute;right:-8px;bottom:-8px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);color:var(--accent)}
.legend .badge-auto,.legend .badge-lock{position:static}
.k-approve .node-card{outline:2px solid var(--accent);outline-offset:3px}
.toc b{color:var(--accent);font-weight:600}
.gloss{display:flex;flex-direction:column;gap:18px}
.gloss dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;margin:0}
@media (max-width:760px){.gloss dl{grid-template-columns:minmax(0,1fr)}}
.gloss dl div{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--b1)}
.gloss dt{font-family:var(--mono);font-size:.75rem;color:var(--accent)}
.gloss dd{margin:0;font-size:.875rem;color:var(--ink2)}
@media print{
.lane-head{position:static}
.lane .steps.sr-only{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.lane,.node-card,.badge-n,.badge-auto,.badge-lock{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`
}
