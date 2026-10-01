import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The Automations page (plan 2026-10-01-automations-flows): the generated
 * page public/automations.html in the document window. The iframe is only
 * there while the window is open, so /projects never downloads it up front.
 * It is same-origin and unsandboxed because we write the page ourselves, which
 * lets it copy the site's theme.
 */
export default function AutomationsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.automations
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
