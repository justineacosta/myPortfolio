'use client'

import { useEffect, useState } from 'react'
import { XIcon } from '@phosphor-icons/react/ssr'
import { chat } from '@/data/chat'
import { CHAT_NUDGE_KEY } from '@/lib/storage-keys'

/** How long a visit runs before the bubble shows, and how often it looks again while the intro still holds the page. */
export const NUDGE = { delayMs: 4000, retryMs: 1000 }

const seen = () => {
  try {
    return sessionStorage.getItem(CHAT_NUDGE_KEY) !== null
  } catch {
    return true
  }
}

const remember = () => {
  try {
    sessionStorage.setItem(CHAT_NUDGE_KEY, '1')
  } catch {
    /* storage blocked: the bubble may show again next page load, which is harmless */
  }
}

/**
 * "How can I help?" beside the launcher, pointing at it: once per visit, a
 * few seconds in, never over the intro, never while the panel is open.
 * Tapping it opens Lumen; the × just closes it.
 */
export default function ChatNudge({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open || seen()) return
    let timer = 0
    const tryShow = () => {
      // The intro holds the page with html[data-intro]; wait it out.
      if (document.documentElement.hasAttribute('data-intro')) {
        timer = window.setTimeout(tryShow, NUDGE.retryMs)
        return
      }
      remember()
      setShow(true)
    }
    timer = window.setTimeout(tryShow, NUDGE.delayMs)
    return () => window.clearTimeout(timer)
  }, [open])

  // Opening the chat any way at all answers the bubble, so it doesn't come back when the panel closes.
  if (open && show) setShow(false)
  if (!show || open) return null
  return (
    <div className="fixed right-17.5 bottom-[calc(119px+env(safe-area-inset-bottom))] z-30 flex animate-rise items-center rounded-2xl border border-b2 bg-s1 shadow-(--tile-shadow) motion-reduce:animate-none shell:bottom-[75px]">
      <button type="button" onClick={onOpen} className="cursor-pointer py-2 pr-1 pl-3.5 text-[13.5px] font-medium whitespace-nowrap text-ink hover:text-accent">
        {chat.nudge.text}
      </button>
      <button type="button" onClick={() => setShow(false)} aria-label={chat.nudge.dismiss} title={chat.nudge.dismiss} className="mr-1.5 grid size-6 cursor-pointer place-items-center rounded-full text-ink3 hover:text-ink">
        <XIcon size={12} aria-hidden />
      </button>
      {/* The tail, pointing at the launcher. */}
      <span aria-hidden className="absolute top-1/2 -right-1.25 size-2.5 -translate-y-1/2 rotate-45 border-t border-r border-b2 bg-s1" />
    </div>
  )
}
