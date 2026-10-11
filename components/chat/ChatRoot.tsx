'use client'

import { useMemo, useRef, useState } from 'react'
import { useChat } from './useChat'
import ChatLauncher from './ChatLauncher'
import ChatPanel from './ChatPanel'

/**
 * The site chat: a launcher on every page and, once opened, the panel. The
 * conversation lives here, so closing the panel never drops a reply that is
 * still arriving. `ai` is whether the server has a key, so Claude answers
 * (without one, the keyless fallback does); `paths` are the site paths a reply
 * may link to.
 */
export default function ChatRoot({ ai, paths }: { ai: boolean; paths: string[] }) {
  const [open, setOpen] = useState(false)
  const launcher = useRef<HTMLButtonElement>(null)
  const convo = useChat()
  const known = useMemo(() => new Set(paths), [paths])

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) launcher.current?.focus()
  }

  return (
    <>
      <ChatLauncher ref={launcher} open={open} onToggle={() => (open ? close(false) : setOpen(true))} />
      {open && <ChatPanel {...convo} known={known} ai={ai} onClose={close} />}
    </>
  )
}
