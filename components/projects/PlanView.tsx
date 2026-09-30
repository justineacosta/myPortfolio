import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The build plan (spec 2026-09-30): the generated page public/build-plan.html
 * in the document window. The iframe is only there while the window is open,
 * so /projects never downloads the plan up front. It is same-origin and
 * unsandboxed because we write the page ourselves, which lets it copy the
 * site's theme.
 */
export default function PlanView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.plan
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
