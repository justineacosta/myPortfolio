'use client'

import type { Ref } from 'react'
import { ChatCircleDotsIcon } from '@phosphor-icons/react/ssr'
import { assistant } from '@/data/assistant'
import { useAssistant } from './AssistantProvider'

/** The panel's DOM id, which the launcher's `aria-controls` points at. */
export const PANEL_DOM_ID = 'assistant-panel'

/** The chat button. Desktop: directly above the accessibility button. Phones: above the tab bar. It opens and closes the panel. */
export default function AssistantLauncher({ ref }: { ref?: Ref<HTMLButtonElement> }) {
  const { open, setOpen } = useAssistant()
  return (
    <button
      ref={ref}
      type="button"
      aria-label={assistant.launcher}
      aria-expanded={open}
      aria-controls={PANEL_DOM_ID}
      onClick={() => setOpen(!open)}
      className="fixed right-5 bottom-[calc(116px+env(safe-area-inset-bottom))] z-30 grid size-10 cursor-pointer place-items-center rounded-xl border border-b1 bg-s1 text-ink2 shadow-(--tile-shadow) transition-all duration-250 hover:-translate-y-0.5 hover:border-b2 hover:text-accent shell:bottom-[72px]"
    >
      <ChatCircleDotsIcon size={18} weight="fill" aria-hidden />
    </button>
  )
}
