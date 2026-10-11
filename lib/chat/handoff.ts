import type { ChatTurn } from '@/lib/chat/validate'
import { MAX_MESSAGE } from '@/lib/contact'
import { HANDOFF_KEY } from '@/lib/storage-keys'

/** Fired on window after a hand-off is saved, for a contact form that is already open to take it. */
export const HANDOFF_EVENT = 'kraft-chat-handoff'

/** What the visitor asked the chat, as a starting message for the contact form. */
export function handoffText(turns: ChatTurn[]): string {
  return turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join('\n\n')
    .slice(0, MAX_MESSAGE)
}

/** Keeps the visitor's questions for the contact form; storage that throws just means an empty form. */
export function saveHandoff(turns: ChatTurn[]): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, handoffText(turns))
  } catch {}
}

/** Reads the saved questions and removes them, so they land in the form only once. */
export function takeHandoff(): string | null {
  try {
    const text = sessionStorage.getItem(HANDOFF_KEY)
    sessionStorage.removeItem(HANDOFF_KEY)
    return text || null
  } catch {
    return null
  }
}
