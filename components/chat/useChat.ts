'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { chat } from '@/data/chat'
import { splitReply } from '@/lib/chat/reply'
import { MAX_LENGTH, MAX_USER_TURNS, type ChatTurn } from '@/lib/chat/validate'
import { CHAT_KEY } from '@/lib/storage-keys'

/** The saved chat, or nothing when it is missing, unreadable or not a history the route would accept. Longer turns are cut when sent, not when shown. */
function restore(): { turns: ChatTurn[]; contact: boolean } {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? 'null')
    // The first version stored the bare list of turns; it is still read.
    const saved = Array.isArray(raw) ? raw : (raw as { turns?: unknown } | null)?.turns
    const ok =
      Array.isArray(saved) &&
      saved.length % 2 === 0 &&
      saved.every((t, i) => t && t.role === (i % 2 ? 'assistant' : 'user') && typeof t.content === 'string' && t.content.trim())
    if (!ok) return { turns: [], contact: false }
    return { turns: saved as ChatTurn[], contact: !Array.isArray(raw) && (raw as { contact?: unknown }).contact === true }
  } catch {
    return { turns: [], contact: false }
  }
}

/** Keeps the chat for the tab; the chat works without it when storage is blocked. */
function save(turns: ChatTurn[], contact: boolean) {
  try {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify({ turns, contact }))
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
 * that fails for any reason leaves the history as it was before the question;
 * `failed` is that dropped question, until the next send starts.
 */
export function useChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [streaming, setStreaming] = useState<string | null>(null)
  const [contact, setContact] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const turnsRef = useRef(turns)
  const busy = useRef(false)

  // Read in an effect, not in render, so the server and first client render agree.
  useEffect(() => {
    const saved = restore()
    turnsRef.current = saved.turns
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists after hydration
    setTurns(saved.turns)
    setContact(saved.contact)
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
    setFailed(null)
    setContact(false)
    setStreaming('')
    let problem: string | null = null
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: asked.map((t) => ({ role: t.role, content: t.content.slice(0, MAX_LENGTH[t.role]) })) }),
      })
      if (!res.ok || !res.body) {
        problem = res.ok ? chat.errors.failed : await failure(res)
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
          save(next, reply.contact)
        } else {
          problem = chat.errors.failed
        }
      }
    } catch {
      problem = chat.errors.failed
    }
    if (problem) {
      // Drop the unanswered question, so the history stays one the route accepts.
      turnsRef.current = before
      setTurns(before)
      setError(problem)
      setFailed(question)
    }
    setStreaming(null)
    busy.current = false
  }, [])

  const capped = turns.filter((t) => t.role === 'user').length >= MAX_USER_TURNS
  return { turns, streaming, contact, error, failed, capped, send }
}
