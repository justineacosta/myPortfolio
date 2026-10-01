import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The Agentic Framework (spec 2026-10-01-agentic-framework): the generated
 * page public/agentic-framework.html in the document window. The iframe is
 * only there while the window is open, so /projects never downloads the page
 * up front. It is same-origin and unsandboxed because we write the page
 * ourselves, which lets it copy the site's theme.
 */
export default function AgenticFrameworkView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = projects.writeups.find((x) => x.view === 'agentic-framework')!
  return (
    <Window open={open} onClose={onClose} title={w.title} href={w.page} flush>
      {open && <iframe src={w.page} title={w.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
