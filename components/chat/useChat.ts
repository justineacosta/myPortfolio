'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { chat } from '@/data/chat'
import { track } from '@/lib/analytics'
import { play } from '@/lib/chat/sound'
import { recent, type ChatTurn } from '@/lib/chat/validate'
import { CHAT_KEY } from '@/lib/storage-keys'

export type Mode = 'live' | 'local' | 'unknown'
/** `failed`: the reply didn't finish (an error, a refusal, Stop, or a reload mid-answer), so it can be asked again. */
export type Message = ChatTurn & { id: string; pending?: boolean; failed?: boolean }

/** How many messages are kept. */
const MAX_STORED = 20
/** How long a saved chat lasts after its last message: three days. */
export const CHAT_TTL_MS = 3 * 24 * 60 * 60 * 1000

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

/** A reply still arriving when the page went away: it has no request left to finish it. */
const settle = (m: Message): Message => (m.pending ? { ...m, pending: false, failed: true, content: chat.replies.interrupted } : m)

/** The saved chat, or nothing when it is missing, unreadable or older than CHAT_TTL_MS. A message saved mid-answer comes back as "interrupted". */
function restore(): { messages: Message[]; mode: Mode } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CHAT_KEY) ?? 'null') as { messages?: unknown; mode?: unknown; at?: unknown } | null
    const list = raw?.messages
    if (!Array.isArray(list) || !list.length) return null
    if (typeof raw?.at !== 'number' || Date.now() - raw.at > CHAT_TTL_MS) {
      localStorage.removeItem(CHAT_KEY)
      return null
    }
    const ok = list.every((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && typeof m.id === 'string')
    if (!ok) return null
    const mode: Mode = raw?.mode === 'live' || raw?.mode === 'local' ? raw.mode : 'unknown'
    return { messages: (list as Message[]).map(settle), mode }
  } catch {
    return null
  }
}

/** Keeps the chat in this browser for CHAT_TTL_MS; the chat works without it when storage is blocked. */
function save(messages: Message[], mode: Mode) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify({ messages: messages.map(settle).slice(-MAX_STORED), mode, at: Date.now() }))
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
 * last (`mode`, from the route's X-Assistant-Mode), and send, retry, stop and
 * reset. Every question gets a reply bubble, even when it fails: the failure
 * is written into it, so the history always alternates. Each request names
 * `page`, the page the visitor has open, so Lumen can answer "what's this?".
 * The chat is kept in this browser for three days after its last message.
 */
export function useChat(page: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [mode, setMode] = useState<Mode>('unknown')
  const [sending, setSending] = useState(false)
  const restored = useRef(false)
  const abort = useRef<AbortController | null>(null)
  // Read when a question is sent, so a send never closes over an old page.
  const pageRef = useRef(page)
  useEffect(() => {
    pageRef.current = page
  }, [page])

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

  /** Asks `question` after `before`, the conversation so far. */
  const ask = useCallback(async (question: string, before: Message[]) => {
    const asked: Message = { id: newId(), role: 'user', content: question }
    const replyId = newId()
    const history = recent([...before, asked])
    setMessages([...before, asked, { id: replyId, role: 'assistant', content: '', pending: true }])
    play('send')
    setSending(true)
    const write = (content: string, pending = false, failed = false) =>
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, content, pending, failed: failed || undefined } : m)))

    const controller = new AbortController()
    abort.current = controller
    let soFar = ''
    let chimed = false
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, page: pageRef.current }),
        signal: controller.signal,
      })
      const answered = res.headers.get('x-assistant-mode')
      if (answered === 'live' || answered === 'local') setMode(answered)
      if (!res.ok || !res.body) {
        write(res.ok ? chat.replies.failed : await refusal(res), false, true)
      } else {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          soFar += decoder.decode(value, { stream: true })
          // The chime marks the answer starting, so it plays on its first words, once.
          if (!chimed && soFar.trim()) {
            chimed = true
            play('reply')
          }
          write(soFar, true)
        }
        soFar += decoder.decode()
        // The route ends a reply cut off mid-answer with the "interrupted" line.
        if (!soFar.trim()) write(chat.replies.empty, false, true)
        else write(soFar, false, soFar.trimEnd().endsWith(chat.replies.interrupted))
      }
    } catch (err) {
      const stopped = err instanceof Error && err.name === 'AbortError'
      write(stopped ? (soFar.trim() ? `${soFar}\n\n${chat.replies.stopped}` : chat.replies.stopped) : chat.replies.failed, false, true)
    } finally {
      setSending(false)
      abort.current = null
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || sending) return
      track('Lumen message')
      await ask(question, messages)
    },
    [ask, messages, sending],
  )

  /** Asks the last question again, in place of the reply that failed. */
  const retry = useCallback(async () => {
    const last = messages.at(-1)
    const question = messages.at(-2)
    if (sending || !last?.failed || question?.role !== 'user') return
    await ask(question.content, messages.slice(0, -2))
  }, [ask, messages, sending])

  const stop = useCallback(() => abort.current?.abort(), [])

  const reset = useCallback(() => {
    abort.current?.abort()
    try {
      localStorage.removeItem(CHAT_KEY)
    } catch {
      /* nothing saved */
    }
    setMessages([])
    setSending(false)
  }, [])

  return { messages, mode, sending, send, retry, stop, reset }
}
