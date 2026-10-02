'use client'

import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useShellNav } from '@/components/shell/NavigationProvider'
import { assistant } from '@/data/assistant'
import { sendChat, sendLead, type LeadFields, type LeadResult } from '@/lib/assistant/client'
import type { ChatMessage } from '@/lib/assistant/limits'

/** One line of the conversation as the panel shows it. */
export type Entry =
  | { id: string; kind: 'user' | 'assistant'; text: string; unfinished?: boolean; quick?: boolean }
  | { id: string; kind: 'navigate'; href: string; label: string }
  | { id: string; kind: 'lead'; ok: boolean }
  | { id: string; kind: 'error'; text: string }
  | { id: string; kind: 'form'; state: 'open' | 'sent' | 'failed' }

type Assistant = {
  open: boolean
  setOpen: (v: boolean) => void
  entries: Entry[]
  streaming: boolean
  send: (text: string) => void
  stop: () => void
  retry: () => void
  submitForm: (id: string, fields: LeadFields) => Promise<LeadResult>
  /** What the visitor has typed into an open form card so far, kept in memory (never in storage) so closing the panel does not lose it. */
  formDraft: (id: string) => LeadFields | undefined
  saveFormDraft: (id: string, fields: LeadFields) => void
  reset: () => void
}

/** Where the conversation is kept for the tab: `{ conversationId, entries }` in sessionStorage. */
export const STORAGE_KEY = 'kraft-assistant'

const Ctx = createContext<Assistant | null>(null)

/** The assistant's state: the open panel, the conversation and the turn in flight. */
export function useAssistant(): Assistant {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAssistant must be used inside <AssistantProvider>')
  return ctx
}

/** A fresh v4 UUID. `crypto.randomUUID` exists only on secure origins (not http over a LAN IP), so without it one is built from `getRandomValues`. */
function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** The history for the server: visitor and assistant text only, and no reply that streamed nothing. */
function toMessages(entries: Entry[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const e of entries) {
    if (e.kind === 'user') out.push({ role: 'user', content: e.text })
    else if (e.kind === 'assistant' && e.text.trim()) out.push({ role: 'assistant', content: e.text })
  }
  return out
}

/** Whether the form card was the last thing on screen that was not the visitor's: the server then does not offer it again. */
function formShownIn(entries: Entry[]): boolean {
  return entries.findLast((e) => e.kind !== 'user')?.kind === 'form'
}

function isEntry(v: unknown): v is Entry {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Record<string, unknown>
  if (typeof e.id !== 'string') return false
  switch (e.kind) {
    case 'user':
    case 'error':
      return typeof e.text === 'string'
    case 'assistant':
      return typeof e.text === 'string' && (e.quick === undefined || typeof e.quick === 'boolean')
    case 'form':
      return e.state === 'open' || e.state === 'sent' || e.state === 'failed'
    case 'navigate':
      return typeof e.href === 'string' && typeof e.label === 'string'
    case 'lead':
      return typeof e.ok === 'boolean'
    default:
      return false
  }
}

/** The stored chat, or null when there is none, storage is blocked or the data is not a chat. */
function readStored(): { conversationId: string; entries: Entry[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { conversationId?: unknown; entries?: unknown }
    if (typeof data.conversationId !== 'string' || !Array.isArray(data.entries)) return null
    return { conversationId: data.conversationId, entries: data.entries.filter(isEntry) }
  } catch {
    return null
  }
}

function writeStored(conversationId: string, entries: Entry[]) {
  try {
    if (entries.length === 0) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId, entries }))
  } catch {
    /* storage is blocked or full: the chat still works, it just is not kept */
  }
}

/** Holds the assistant's conversation for the whole site, so it survives page changes and reloads in the tab. */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { go } = useShellNav()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [conversationId, setConversationId] = useState(newId)
  const [streaming, setStreaming] = useState(false)
  // Storage is read after mount, so the server render and the first client render agree; nothing is written before then.
  const [restored, setRestored] = useState(false)

  // Refs hold the latest values, so a stream that outlives a render never works from stale ones.
  const entriesRef = useRef<Entry[]>([])
  const idRef = useRef(conversationId)
  const pageRef = useRef(pathname)
  const goRef = useRef(go)
  const streamingRef = useRef(false)
  // The form entries being sent, so a second submit for the same card cannot slip in before the first settles.
  const sendingRef = useRef(new Set<string>())
  // Each open form card's half-typed fields, by entry id. Memory only: a visitor's name and email never go to sessionStorage unsent.
  const draftsRef = useRef(new Map<string, LeadFields>())
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    pageRef.current = pathname
    goRef.current = go
  })

  const update = useCallback((fn: (es: Entry[]) => Entry[]) => {
    entriesRef.current = fn(entriesRef.current)
    setEntries(entriesRef.current)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage exists only in the browser, so the saved chat can only be read after hydration */
  useEffect(() => {
    const stored = readStored()
    if (stored) {
      idRef.current = stored.conversationId
      entriesRef.current = stored.entries
      setConversationId(stored.conversationId)
      setEntries(stored.entries)
    }
    setRestored(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (restored) writeStored(conversationId, entries)
  }, [restored, conversationId, entries])

  useEffect(() => () => abortRef.current?.abort(), [])

  const run = useCallback(
    async (messages: ChatMessage[], formShown: boolean) => {
      const controller = new AbortController()
      abortRef.current = controller
      streamingRef.current = true
      setStreaming(true)
      // The assistant entry the text deltas are building, if one is open.
      let current: string | null = null
      // After a `source` event the rest of the turn is the site's quick answer.
      let quick = false
      // `done` or an `error` event ends the turn; a stream that ends without either was cut off.
      let finished = false
      const markUnfinished = () => {
        const id = current
        if (id) update((es) => es.map((e) => (e.id === id && e.kind === 'assistant' ? { ...e, unfinished: true } : e)))
      }
      try {
        for await (const ev of sendChat({ conversationId: idRef.current, page: pageRef.current, messages, formShown }, controller.signal)) {
          // A reset took over while this event was in flight: it belongs to the old chat.
          if (abortRef.current !== controller) break
          if (ev.type === 'text') {
            if (!current) {
              const id = (current = newId())
              update((es) => [...es, { id, kind: 'assistant', text: '', ...(quick && { quick }) }])
            }
            const id = current
            update((es) => es.map((e) => (e.id === id && e.kind === 'assistant' ? { ...e, text: e.text + ev.delta } : e)))
          } else if (ev.type === 'source') {
            // Claude failed partway: whatever it had streamed is dropped, and the site's answer starts a fresh bubble.
            const id = current
            if (id) update((es) => es.filter((e) => e.id !== id))
            current = null
            quick = true
          } else if (ev.type === 'form') {
            current = null
            update((es) => [...es, { id: newId(), kind: 'form', state: 'open' }])
          } else if (ev.type === 'navigate') {
            current = null
            update((es) => [...es, { id: newId(), kind: 'navigate', href: ev.href, label: ev.label }])
            goRef.current(ev.href)
          } else if (ev.type === 'lead') {
            current = null
            update((es) => [...es, { id: newId(), kind: 'lead', ok: ev.ok }])
          } else if (ev.type === 'error') {
            markUnfinished()
            current = null
            finished = true
            update((es) => [...es, { id: newId(), kind: 'error', text: ev.error }])
          } else if (ev.type === 'done') {
            finished = true
          }
        }
      } catch {
        // sendChat does not throw; this guards the loop all the same, and a thrown stream counts as cut off.
      }
      // A stop, a reset or a newer turn took over: that one owns the state now.
      if (abortRef.current !== controller) return
      if (controller.signal.aborted) markUnfinished()
      else if (!finished) {
        // The stream ended without `done`: a partial reply stays, marked; with no text there is only the error.
        if (current) markUnfinished()
        else update((es) => [...es, { id: newId(), kind: 'error', text: assistant.errors.failed }])
      }
      abortRef.current = null
      streamingRef.current = false
      setStreaming(false)
    },
    [update],
  )

  const send = useCallback(
    (text: string) => {
      if (streamingRef.current || !text.trim()) return
      update((es) => [...es, { id: newId(), kind: 'user', text }])
      void run(toMessages(entriesRef.current), formShownIn(entriesRef.current))
    },
    [run, update],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const retry = useCallback(() => {
    if (streamingRef.current) return
    const all = entriesRef.current
    const last = all.findLastIndex((e) => e.kind === 'user')
    if (last < 0) return
    // Drop what the failed turn left behind, then send the history up to the visitor's last message.
    update((es) => es.filter((e, i) => i <= last || !(e.kind === 'error' || (e.kind === 'assistant' && e.unfinished))))
    void run(toMessages(all.slice(0, last + 1)), formShownIn(all.slice(0, last + 1)))
  }, [run, update])

  const submitForm = useCallback(
    async (id: string, fields: LeadFields): Promise<LeadResult> => {
      const card = entriesRef.current.find((e) => e.id === id)
      if (card?.kind !== 'form' || card.state !== 'open' || sendingRef.current.has(id)) return { ok: false }
      sendingRef.current.add(id)
      try {
        const res = await sendLead({ ...fields, conversationId: idRef.current, page: pageRef.current, messages: toMessages(entriesRef.current) })
        // Field errors leave the card open for another go; any other outcome settles it.
        if (res.ok || !res.errors) {
          const state = res.ok ? 'sent' : 'failed'
          draftsRef.current.delete(id)
          update((es) => es.map((e) => (e.id === id && e.kind === 'form' ? { ...e, state } : e)))
        }
        return res
      } finally {
        sendingRef.current.delete(id)
      }
    },
    [update],
  )

  const formDraft = useCallback((id: string) => draftsRef.current.get(id), [])
  const saveFormDraft = useCallback((id: string, fields: LeadFields) => void draftsRef.current.set(id, fields), [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    streamingRef.current = false
    setStreaming(false)
    draftsRef.current.clear()
    const id = newId()
    idRef.current = id
    setConversationId(id)
    update(() => [])
  }, [update])

  const value = useMemo(
    () => ({ open, setOpen, entries, streaming, send, stop, retry, submitForm, formDraft, saveFormDraft, reset }),
    [open, entries, streaming, send, stop, retry, submitForm, formDraft, saveFormDraft, reset],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
