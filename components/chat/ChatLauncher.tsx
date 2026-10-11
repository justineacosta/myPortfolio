'use client'

import type { Ref } from 'react'
import { ChatCircleDotsIcon } from '@phosphor-icons/react/ssr'
import { chat } from '@/data/chat'

/** The panel's DOM id, which the launcher's `aria-controls` points at. */
export const PANEL_DOM_ID = 'chat-panel'

/**
 * Lumen's button: the chat icon in a tile like the accessibility button's,
 * with a green dot that says the chat is there to answer. Desktop: directly
 * above the accessibility button. Phones: above the tab bar. While the panel
 * is open, the tile is lit.
 */
export default function ChatLauncher({ open, onToggle, ref }: { open: boolean; onToggle: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={chat.launcher}
      aria-expanded={open}
      aria-controls={PANEL_DOM_ID}
      onClick={onToggle}
      className={`fixed right-5 bottom-[calc(116px+env(safe-area-inset-bottom))] z-30 grid size-10 cursor-pointer place-items-center rounded-xl border bg-s1 shadow-(--tile-shadow) transition-all duration-250 hover:-translate-y-0.5 hover:text-accent motion-reduce:hover:translate-y-0 shell:bottom-[72px] ${open ? 'border-accent text-accent' : 'border-b1 text-ink2 hover:border-b2'}`}
    >
      <ChatCircleDotsIcon size={18} weight="fill" aria-hidden />
      <span aria-hidden className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent ring-2 ring-s1" />
    </button>
  )
}
