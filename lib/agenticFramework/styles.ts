import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The Agentic Framework page's CSS: the build plan's look (imported as it is,
 * never edited), plus tiles, the two jobs, rule pins, the timeline, the
 * closing line and the glossary (spec §4).
 */
export function afCss(themes: Themes): string {
  return `${pageCss(themes)}
.page>section{display:flex;flex-direction:column;gap:20px}
.stance{font-weight:600;color:var(--ink)}
.stack{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.stack li{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;border:1px solid var(--b1);background:var(--s1);font-size:.8125rem;color:var(--ink2)}
.stack svg{color:var(--accent)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px;margin:0;padding:0;list-style:none}
.tile{display:flex;flex-direction:column;gap:8px;min-width:0;padding:18px;border-radius:16px;border:1px solid var(--b1);background:var(--s1)}
.tile-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tile-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;border:1px solid var(--b1);background:var(--chip);color:var(--accent)}
.tile-mark{font-family:var(--mono);font-size:.625rem;letter-spacing:.14em;color:var(--ink3)}
.tile h3{font-size:1rem;letter-spacing:-.01em}
.tile p{font-size:.875rem;color:var(--ink2)}
.tile-note{margin-top:auto;padding-top:4px;font-family:var(--mono);font-size:.6875rem;color:var(--ink3)}
.jobs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (max-width:640px){.jobs{grid-template-columns:minmax(0,1fr)}}
.job{display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px;border-radius:16px;border:1px solid var(--b1);background:var(--s1)}
.job:first-child{border-color:var(--washB);background:var(--wash)}
.job h3{font-family:var(--mono);font-size:.6875rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.job ul{gap:6px}
.jobs-line{max-width:62ch;color:var(--ink3)}
.legend .line{display:inline-block;width:26px;border-top:2px solid var(--b2)}
.legend .line-signal{width:10px;height:10px;border:0;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash)}
.legend .line-loop{border-top:2px dashed var(--accent)}
.legend .badge-lock{position:static}
.edge.loop{stroke:color-mix(in srgb,var(--accent) 55%,var(--b2));stroke-dasharray:5 5}
.edge.loop.lit{stroke:var(--accent)}
.badge-lock{position:absolute;right:-8px;bottom:-8px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);color:var(--accent)}
.k-approve .node-card{outline:2px solid var(--accent);outline-offset:3px}
.node-label,.node-sub{width:max-content;max-width:136px;padding:0 4px;border-radius:4px;background:var(--s0)}
@media (max-width:480px){.pan-hint{display:none}}
.pin{position:absolute;z-index:2;display:grid;place-items:center;width:24px;height:24px;padding:0;border-radius:50%;border:1px solid var(--accent);background:var(--s0);color:var(--accent);font-family:var(--mono);font-size:.5625rem;font-weight:500;cursor:pointer}
.pin:hover,.pin[aria-expanded=true]{background:var(--accent);color:var(--onAccent)}
.pin-sample{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--accent);font-family:var(--mono);font-size:.5rem;color:var(--accent)}
.timeline{display:flex;flex-direction:column;gap:0;margin:0;padding:0;list-style:none}
.timeline li{display:grid;grid-template-columns:28px 92px minmax(0,1fr);gap:12px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--b1)}
@media (max-width:560px){.timeline li{grid-template-columns:28px minmax(0,1fr)}.timeline li p{grid-column:2}}
.timeline p{color:var(--ink2)}
.tl-n{font-family:var(--mono);font-size:.75rem;color:var(--ink3)}
.tag{justify-self:start;padding:2px 8px;border-radius:999px;border:1px solid var(--b2);font-family:var(--mono);font-size:.625rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);white-space:nowrap}
.t-frame{border-color:var(--accent);color:var(--accent)}
.t-build{border-color:var(--washB);background:var(--wash);color:var(--accent)}
.t-check{border-color:var(--ink3);color:var(--ink)}
.t-fold-back{border-style:dashed;border-color:var(--accent);color:var(--accent)}
.t-ship{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.see{align-self:flex-start;font-weight:600;text-decoration:none}
.closing{font-size:clamp(1.6rem,4vw,2.5rem);font-weight:700;line-height:1.1;letter-spacing:-.03em;text-wrap:balance;color:var(--ink)}
.gl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;margin:0}
@media (max-width:760px){.gl{grid-template-columns:minmax(0,1fr)}}
.gl div{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--b1)}
.gl dt{font-family:var(--mono);font-size:.75rem;color:var(--accent)}
.gl dd{margin:0;font-size:.875rem;color:var(--ink2)}
@media print{
.tile,.job,.tag,.pin,.node-card,.badge-lock{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`
}
