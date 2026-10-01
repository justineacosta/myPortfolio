import { projects } from '@/data/projects'
import Window from './Window'

/**
 * AI agents and RAG chatbots (spec 2026-10-01-agents-page): the generated page
 * public/ai-agents.html in the card's window. The iframe is only there while
 * the window is open, so /projects never downloads the page up front. It is
 * same-origin and unsandboxed because we write the page ourselves, which lets
 * it copy the site's theme.
 */
export default function AgentsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.agents
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
