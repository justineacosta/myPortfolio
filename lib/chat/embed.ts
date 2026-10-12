/**
 * The messages between Lumen's frame (components/chat/ChatEmbed.tsx) and the
 * script that opens it on the case-study and write-up pages
 * (public/lumen-embed.js, which repeats these names: it is plain JS served as is).
 */
export const EMBED_MESSAGE = { open: 'lumen:open', close: 'lumen:close', theme: 'lumen:theme' } as const

export type EmbedMessage =
  | { type: typeof EMBED_MESSAGE.open }
  | { type: typeof EMBED_MESSAGE.close }
  | { type: typeof EMBED_MESSAGE.theme; theme: string }

/** Where the frame lives. */
export const EMBED_PATH = '/lumen'

/** The script tag the generated pages carry. */
export const EMBED_SCRIPT = '<script src="/lumen-embed.js" defer></script>'

/** A generated page with the launcher's script just before `</body>`; a page that has it already is left alone. */
export function withLumen(html: string): string {
  if (html.includes(EMBED_SCRIPT)) return html
  const at = html.lastIndexOf('</body>')
  return at < 0 ? html : `${html.slice(0, at)}${EMBED_SCRIPT}${html.slice(at)}`
}
