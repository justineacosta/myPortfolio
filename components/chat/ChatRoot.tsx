'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useShellNav } from '@/components/shell/NavigationProvider'
import { track } from '@/lib/analytics'
import type { CardProject } from '@/lib/chat/samples'
import { play } from '@/lib/chat/sound'
import { useChat } from './useChat'
import ChatLauncher from './ChatLauncher'
import ChatNudge from './ChatNudge'
import ChatPanel from './ChatPanel'

/** Whether a key press happened while typing somewhere, so `/` is a character there, not a shortcut. */
const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

const onHash = (change: () => void) => {
  window.addEventListener('hashchange', change)
  return () => window.removeEventListener('hashchange', change)
}

/**
 * Lumen on every page: the launcher and, once opened, the panel. The
 * conversation lives here, so closing the panel never drops a reply that is
 * still arriving. `/` opens it from anywhere you aren't typing, and a
 * "How can I help?" bubble offers it once per visit. `ai` is
 * whether the server has a key; `paths` are the site paths a reply may link
 * to; `projects` are the sample systems a reply may show as cards. The page
 * the visitor has open (its path, and its hash when a card is open over it)
 * goes with every question and picks the starter chips.
 */
export default function ChatRoot({ ai, paths, projects }: { ai: boolean; paths: string[]; projects: CardProject[] }) {
  const [open, setOpen] = useState(false)
  const launcher = useRef<HTMLButtonElement>(null)
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '')
  const page = `${usePathname() ?? '/'}${hash}`
  const convo = useChat(page)
  const { go } = useShellNav()
  const known = useMemo(() => new Set(paths), [paths])
  const openChat = () => {
    play('open')
    track('Lumen opened')
    setOpen(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || open || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      // Another dialog (the palette, a project view) keeps the key.
      if (document.documentElement.hasAttribute('data-dialog') || document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return
      e.preventDefault()
      play('open')
      track('Lumen opened')
      setOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = (refocus: boolean) => {
    play('close')
    setOpen(false)
    if (refocus) launcher.current?.focus()
  }

  return (
    <>
      <ChatLauncher ref={launcher} open={open} onToggle={() => (open ? close(false) : openChat())} />
      <ChatNudge open={open} onOpen={openChat} />
      {open && <ChatPanel {...convo} page={page} known={known} projects={projects} ai={ai} go={go} onClose={close} />}
    </>
  )
}
