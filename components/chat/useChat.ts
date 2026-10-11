'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { chat } from '@/data/chat'
import { splitReply } from '@/lib/chat/reply'
import type { ChatTurn } from '@/lib/chat/validate'
import { CHAT_KEY } from '@/lib/storage-keys'

/** How many questions a visitor may ask in one chat. */
const MAX_USER_TURNS = 10

/** The saved chat, or nothing when it is missing, unreadable or not a history the route would accept. */
function restore(): ChatTurn[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? 'null')
    const ok =
      Array.isArray(saved) &&
      saved.length % 2 === 0 &&
      saved.every((t, i) => t && t.role === (i % 2 ? 'assistant' : 'user') && typeof t.content === 'string')
    return ok ? (saved as ChatTurn[]) : []
  } catch {
    return []
  }
}

/** Keeps the chat for the tab; the chat works without it when storage is blocked. */
function save(turns: ChatTurn[]) {
  try {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(turns))
  } catch {
    /* private mode or blocked site data: the chat lasts as long as the page */
  }
}

/** The sentence for a failed response: the route's own when it sent one, else the generic one. */
async function failure(res: Response): Promise<string> {
  try {
    const { error } = await res.json()
    if (typeof error === 'string' && error) return error
  } catch {
    /* not JSON */
  }
  return chat.errors.failed
}

/**
 * The conversation with the site assistant: the turns so far, the reply being
 * streamed, whether it asked for the hand-off, and the last error. A request
 * that fails for any reason leaves the history as it was before the question.
 */
export function useChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [streaming, setStreaming] = useState<string | null>(null)
  const [contact, setContact] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnsRef = useRef(turns)
  const busy = useRef(false)

  // Read in an effect, not in render, so the server and first client render agree.
  useEffect(() => {
    const saved = restore()
    turnsRef.current = saved
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists after hydration
    setTurns(saved)
  }, [])

  const send = useCallback(async (text: string) => {
    const question = text.trim()
    const before = turnsRef.current
    if (!question || busy.current || before.filter((t) => t.role === 'user').length >= MAX_USER_TURNS) return
    busy.current = true
    const asked = [...before, { role: 'user' as const, content: question }]
    turnsRef.current = asked
    setTurns(asked)
    setError(null)
    setContact(false)
    setStreaming('')
    let failed: string | null = null
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: asked }),
      })
      if (!res.ok || !res.body) {
        failed = res.ok ? chat.errors.failed : await failure(res)
      } else {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
          setStreaming(splitReply(raw).text)
        }
        const reply = splitReply(raw + decoder.decode())
        if (reply.text) {
          const next = [...asked, { role: 'assistant' as const, content: reply.text }]
          turnsRef.current = next
          setTurns(next)
          setContact(reply.contact)
          save(next)
        } else {
          failed = chat.errors.failed
        }
      }
    } catch {
      failed = chat.errors.failed
    }
    if (failed) {
      // Drop the unanswered question, so the history stays one the route accepts.
      turnsRef.current = before
      setTurns(before)
      setError(failed)
    }
    setStreaming(null)
    busy.current = false
  }, [])

  const capped = turns.filter((t) => t.role === 'user').length >= MAX_USER_TURNS
  return { turns, streaming, contact, error, capped, send }
}
