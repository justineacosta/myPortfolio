import type { Metadata } from 'next'
import ChatEmbed from '@/components/chat/ChatEmbed'
import { KNOWN_PATHS } from '@/lib/chat/prompt'
import { CARD_PROJECTS } from '@/lib/chat/samples'

/** Only ever seen inside the frame on the case-study and write-up pages, so search engines leave it out. */
export const metadata: Metadata = { title: 'Lumen', robots: { index: false, follow: false } }

/** Lumen alone, for public/lumen-embed.js to frame: no shell, no launcher, the panel always open. */
export default function LumenPage() {
  return <ChatEmbed ai={Boolean(process.env.ANTHROPIC_API_KEY)} paths={[...KNOWN_PATHS]} projects={CARD_PROJECTS} />
}
