'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { chat } from '@/data/chat'
import { recent, type ChatTurn } from '@/lib/chat/validate'
import { CHAT_KEY } from '@/lib/storage-keys'

export type Mode = 'live' | 'local' | 'unknown'
export type Message = ChatTurn & { id: string; pending?: boolean }

/** How many messages are kept for the tab. */
const MAX_STORED = 20

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

/** The saved chat, or nothing when it is missing or unreadable. A message saved mid-answer comes back as "interrupted". */
function restore(): { messages: Message[]; mode: Mode } | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? 'null') as { messages?: unknown; mode?: unknown } | null
    const list = raw?.messages
    if (!Array.isArray(list) || !list.length) return null
    const ok = list.every((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && typeof m.id === 'string')
    if (!ok) return null
    const mode: Mode = raw?.mode === 'live' || raw?.mode === 'local' ? raw.mode : 'unknown'
    return { messages: (list as Message[]).map((m) => (m.pending ? { ...m, pending: false, content: chat.replies.interrupted } : m)), mode }
  } catch {
    return null
  }
}

/** Keeps the chat for the tab; the chat works without it when storage is blocked. */
function save(messages: Message[], mode: Mode) {
  try {
    // A message still arriving has no request left to finish it after a reload.
    const settled = messages.map((m) => (m.pending ? { ...m, pending: false, content: chat.replies.interrupted } : m))
    sessionStorage.setItem(CHAT_KEY, JSON.stringify({ messages: settled.slice(-MAX_STORED), mode }))
  } catch {
    /* private mode or blocked site data: the chat lasts as long as the page */
  }
}

/** The sentence a refused request sent, or the generic one. */
async function refusal(res: Response): Promise<string> {
  try {
    const { error } = await res.json()
    if (typeof error === 'string' && error) return error
  } catch {
    /* not JSON */
  }
  return chat.replies.failed
}

/**
 * The conversation with Lumen, ported from the old portfolio's widget: the
 * messages (a reply in progress is one of them, marked pending), who answered
 * last (`mode`, from the route's X-Assistant-Mode), and send, stop and reset.
 * Every question gets a reply bubble, even when it fails: the failure is
 * written into it, so the history always alternates.
 */
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [mode, setMode] = useState<Mode>('unknown')
  const [sending, setSending] = useState(false)
  const restored = useRef(false)
  const abort = useRef<AbortController | null>(null)

  // Read in an effect, not in render, so the server and first client render agree.
  useEffect(() => {
    const saved = restore()
    restored.current = true
    if (!saved) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists after hydration
    setMessages(saved.messages)
    setMode(saved.mode)
  }, [])

  useEffect(() => {
    // Not before the restore has run, or the empty first render would overwrite the saved chat.
    if (restored.current && messages.length) save(messages, mode)
  }, [messages, mode])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || sending) return
      const asked: Message = { id: newId(), role: 'user', content: question }
      const replyId = newId()
      const history = recent([...messages, asked])
      setMessages((prev) => [...prev, asked, { id: replyId, role: 'assistant', content: '', pending: true }])
      setSending(true)
      const write = (content: string, pending = false) => setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, content, pending } : m)))

      const controller = new AbortController()
      abort.current = controller
      let soFar = ''
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })
        const answered = res.headers.get('x-assistant-mode')
        if (answered === 'live' || answered === 'local') setMode(answered)
        if (!res.ok || !res.body) {
          write(res.ok ? chat.replies.failed : await refusal(res))
        } else {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            soFar += decoder.decode(value, { stream: true })
            write(soFar)
          }
          soFar += decoder.decode()
          write(soFar.trim() ? soFar : chat.replies.empty)
        }
      } catch (err) {
        const stopped = err instanceof Error && err.name === 'AbortError'
        write(stopped ? (soFar.trim() ? `${soFar}\n\n${chat.replies.stopped}` : chat.replies.stopped) : chat.replies.failed)
      } finally {
        setSending(false)
        abort.current = null
      }
    },
    [messages, sending],
  )

  const stop = useCallback(() => abort.current?.abort(), [])

  const reset = useCallback(() => {
    abort.current?.abort()
    try {
      sessionStorage.removeItem(CHAT_KEY)
    } catch {
      /* nothing saved */
    }
    setMessages([])
    setSending(false)
  }, [])

  return { messages, mode, sending, send, stop, reset }
}
