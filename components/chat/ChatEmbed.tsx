'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CardProject } from '@/lib/chat/samples'
import { play } from '@/lib/chat/sound'
import { EMBED_MESSAGE, type EmbedMessage } from '@/lib/chat/embed'
import { useChat } from './useChat'
import ChatPanel from './ChatPanel'

/** Tells the page around the frame something; nothing when the panel isn't framed. */
function tell(message: EmbedMessage) {
  if (window.parent !== window) window.parent.postMessage(message, window.location.origin)
}

/**
 * Lumen inside the frame that public/lumen-embed.js opens on the case-study
 * and write-up pages: the panel alone, always open. The page it sits on comes
 * in as `?page=`, so Lumen knows which case the visitor is reading, and the
 * conversation is the site's own (the same storage), so it carries over both
 * ways. Links open in the window around the frame; closing, and the theme,
 * travel by postMessage, same origin only.
 */
export default function ChatEmbed({ ai, paths, projects }: { ai: boolean; paths: string[]; projects: CardProject[] }) {
  const [page, setPage] = useState('')
  const convo = useChat(page)
  const known = useMemo(() => new Set(paths), [paths])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query only exists in the browser; the page itself stays static
    setPage(new URLSearchParams(window.location.search).get('page') ?? '')
  }, [])

  useEffect(() => {
    // A link in a reply leaves the frame: it opens in the page around it, not inside the panel.
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (link instanceof HTMLAnchorElement && !link.target) link.target = '_top'
    }
    // The page around says when it shows the panel again, and when its theme changes.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return
      const message = e.data as EmbedMessage | null
      if (message?.type === EMBED_MESSAGE.open) {
        play('open')
        document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
      } else if (message?.type === EMBED_MESSAGE.theme && (message.theme === 'light' || message.theme === 'dark')) {
        document.documentElement.setAttribute('data-theme', message.theme)
      }
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('message', onMessage)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const go = (href: string) => {
    window.top!.location.href = href
  }
  const close = () => {
    play('close')
    tell({ type: EMBED_MESSAGE.close })
  }

  return <ChatPanel {...convo} page={page} known={known} projects={projects} ai={ai} go={go} onClose={close} />
}
