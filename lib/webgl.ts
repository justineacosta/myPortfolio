/**
 * Frees a three.js renderer now, not whenever the browser gets round to it:
 * GPU resources go while the context is alive, then the context itself.
 * Browsers cap live WebGL contexts, so an old one lingering can cost the next.
 */
export function releaseRenderer(r: { dispose(): void; forceContextLoss(): void }) {
  r.dispose()
  r.forceContextLoss()
}
