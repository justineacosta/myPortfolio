'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowElbowDownLeftIcon,
  ArrowUpIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CheckIcon,
  CopyIcon,
  RobotIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  StopIcon,
  XIcon,
} from '@phosphor-icons/react/ssr'
import { useShellNav } from '@/components/shell/NavigationProvider'
import { chat } from '@/data/chat'
import { prefersReducedMotion } from '@/lib/motion'
import { copyText, hasLeadForm, leadDraft, optionsOf, plainText } from '@/lib/chat/rich'
import type { CardProject } from '@/lib/chat/samples'
import { PAGE_CHIPS, startersFor, suggestionsFor } from '@/lib/chat/suggestions'
import { isMuted, play, setMuted } from '@/lib/chat/sound'
import { MAX_LENGTH } from '@/lib/chat/validate'
import { CHAT_WIDE_KEY } from '@/lib/storage-keys'
import { PANEL_DOM_ID } from './ChatLauncher'
import RichText from './RichText'
import type { Message, Mode } from './useChat'

const TITLE_ID = `${PANEL_DOM_ID}-title`
/** The dialogs and menus the site draws (the palette, the accessibility menu, a view's native dialog). */
const OVERLAY = '[role="dialog"], [role="menu"], dialog'
const bubble = 'max-w-[88%] rounded-2xl border px-3 py-2 text-[13.5px] leading-normal'
/** How close to the end of the log still counts as reading the latest, in px. */
const NEAR_END = 48
const actionButton = 'inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-ink3 hover:bg-chip hover:text-ink disabled:cursor-default disabled:opacity-40'
const iconButton = 'grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:text-ink3'

/** Whether `el` is inside a dialog or menu other than this panel. */
function inOtherOverlay(el: EventTarget | null, panel: HTMLElement | null): boolean {
  const box = el instanceof Element ? el.closest(OVERLAY) : null
  return box !== null && box !== panel
}

/** The three dots while Lumen thinks. */
function Typing() {
  return (
    <span role="status" aria-label={chat.thinking} className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden style={{ animationDelay: `${i * 150}ms` }} className="size-1.5 animate-pulse-dot rounded-full bg-ink3 motion-reduce:animate-none" />
      ))}
    </span>
  )
}

/**
 * Lumen's panel (the old portfolio's ai-chat-widget.tsx, in Kraft's style):
 * a card above the launcher on desktop, a full-height sheet on phones. A
 * non-modal dialog, so the page behind stays usable. The header carries the
 * Claude badge and resets the chat; the privacy line follows who answered last
 * (Claude or the offline rules); chips under the messages suggest what to
 * ask next, starting from ones for the page the visitor is on; Enter sends,
 * Shift+Enter adds a line, and the send button stops a reply that is still
 * arriving. The log follows a reply in while the visitor is at its end;
 * scrolled up, it stays put and a pill offers the way back. Each finished
 * reply can be copied, and one that failed can be asked again. On desktop the
 * header can widen the panel, and that choice is kept for the browser.
 */
export default function ChatPanel({
  messages,
  mode,
  sending,
  send,
  retry,
  stop,
  reset,
  page,
  known,
  projects,
  ai,
  onClose,
}: {
  messages: Message[]
  mode: Mode
  sending: boolean
  send: (text: string) => Promise<void>
  retry: () => Promise<void>
  stop: () => void
  reset: () => void
  /** The page the visitor has open, as the widget sends it. */
  page: string
  known: ReadonlySet<string>
  projects: CardProject[]
  /** Whether the server has a key, for the privacy note before anyone has asked. */
  ai: boolean
  onClose: (refocus: boolean) => void
}) {
  const { go } = useShellNav()
  const [typed, setTyped] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => input.current?.focus(), [])

  // Whether the sounds are muted, read after mount: storage only exists in the browser.
  const [muted, setMutedState] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists after hydration
    setMutedState(isMuted())
  }, [])
  const toggleSound = () => {
    setMuted(!muted)
    setMutedState(!muted)
    // Turning sound on answers with a tick, so the visitor hears it worked.
    if (muted) play('open')
  }

  // Esc closes the panel unless something else has already taken the key or holds focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || e.defaultPrevented) return
      if (document.documentElement.hasAttribute('data-dialog')) return
      if (inOtherOverlay(e.target, panel.current) || inOtherOverlay(document.activeElement, panel.current)) return
      e.preventDefault()
      onClose(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Whether the log follows new words in: true while the visitor is at its end.
  const sticky = useRef(true)
  const [atEnd, setAtEnd] = useState(true)
  const onScroll = () => {
    const el = list.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_END
    sticky.current = near
    setAtEnd(near)
  }
  useEffect(() => {
    if (sticky.current && list.current) list.current.scrollTop = list.current.scrollHeight
  }, [messages])
  const stick = () => {
    sticky.current = true
    setAtEnd(true)
  }
  const toEnd = () => {
    stick()
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  // The wider desktop panel, read after mount: storage only exists in the browser.
  const [wide, setWide] = useState(false)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- storage only exists after hydration
      setWide(localStorage.getItem(CHAT_WIDE_KEY) === 'wide')
    } catch {
      /* blocked storage: the usual size */
    }
  }, [])
  const toggleWide = () => {
    setWide(!wide)
    try {
      if (wide) localStorage.removeItem(CHAT_WIDE_KEY)
      else localStorage.setItem(CHAT_WIDE_KEY, 'wide')
    } catch {
      /* blocked storage: the size lasts as long as the page */
    }
  }

  // The reply just copied, so its button can say so for a moment.
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(null), 1500)
    return () => window.clearTimeout(t)
  }, [copied])
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(copyText(text, window.location.origin))
      setCopied(id)
    } catch {
      /* no clipboard access: nothing to confirm */
    }
  }

  // The box grows with what's typed, up to five lines or so.
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [typed])

  const lastOf = (role: 'user' | 'assistant') => messages.findLast((m) => m.role === role && !m.pending)?.content ?? null
  // When Lumen's last reply asked something, its options are the chips; otherwise the usual suggestions.
  const offered = optionsOf(lastOf('assistant') ?? '')
  const suggestions = !messages.length ? startersFor(page) : offered.length ? offered : suggestionsFor(lastOf('assistant'), lastOf('user'))
  // Only the first reply that asks for the form draws it; two forms in one chat would read as broken.
  const formOwner = useMemo(() => messages.find((m) => m.role === 'assistant' && hasLeadForm(m.content))?.id, [messages])
  // The form's message starts with what the visitor asked before it appeared, less the questions that only mean something beside their page.
  const draft = useMemo(() => {
    const at = messages.findIndex((m) => m.id === formOwner)
    return at < 0 ? '' : leadDraft(messages.slice(0, at).filter((m) => m.role === 'user' && !PAGE_CHIPS.has(m.content)).map((m) => m.content), chat.lead.draftIntro)
  }, [messages, formOwner])
  const last = messages[messages.length - 1]
  // Only a finished reply is announced, never the one still arriving.
  const announced = !sending && last?.role === 'assistant' ? plainText(last.content) : ''
  const shownMode = mode === 'unknown' ? (ai ? 'live' : 'local') : mode

  // Following a reply link leaves the chat; focus stays with the page it opens.
  const follow = () => onClose(false)
  // Asking always brings the log back to its end, to follow the answer in.
  const ask = (text: string) => {
    stick()
    void send(text)
  }
  const askAgain = () => {
    stick()
    void retry()
  }
  const submit = () => {
    if (sending || !typed.trim()) return
    ask(typed)
    setTyped('')
  }
  const startOver = () => {
    reset()
    setTyped('')
    input.current?.focus()
  }

  return (
    <div
      ref={panel}
      id={PANEL_DOM_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={TITLE_ID}
      data-a11y-scale
      data-lenis-prevent
      className={`fixed inset-0 z-40 flex animate-rise flex-col overflow-hidden bg-linear-to-b from-s2 to-s1 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ink shell:inset-auto shell:right-5 shell:bottom-[124px] shell:max-h-[calc(100dvh-144px)] shell:rounded-2xl shell:transition-[width,height] shell:duration-200 motion-reduce:transition-none ${wide ? 'shell:h-[calc(100dvh-144px)] shell:w-[min(720px,calc(100vw-40px))]' : 'shell:h-140 shell:w-100'} shell:border shell:border-b2 shell:pt-0 shell:pb-0 shell:shadow-(--palette-shadow)`}
    >
      <div className="flex items-center gap-2.5 border-b border-b1 px-4 py-3">
        <span aria-hidden className="relative grid size-8 shrink-0 place-items-center rounded-[10px] border border-wash-b bg-wash text-accent">
          <RobotIcon size={17} weight="fill" />
          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-accent ring-2 ring-s2" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="flex items-center gap-2">
            <h2 id={TITLE_ID} className="text-[15px] font-semibold tracking-[-.01em]">
              {chat.name}
            </h2>
            <span title={chat.badge.title} className="rounded-md border border-wash-b bg-wash px-1.5 py-0.5 font-mono text-[8.5px] tracking-[.12em] text-accent uppercase">
              {chat.badge.label}
            </span>
          </span>
          <span className="truncate text-[11.5px] text-ink3">{chat.subtitle}</span>
        </div>
        <button type="button" onClick={toggleWide} aria-pressed={wide} aria-label={chat.size.expand} title={wide ? chat.size.shrink : chat.size.expand} className={`${iconButton} hidden shell:grid`}>
          {wide ? <ArrowsInSimpleIcon size={15} aria-hidden /> : <ArrowsOutSimpleIcon size={15} aria-hidden />}
        </button>
        <button type="button" onClick={toggleSound} aria-pressed={muted} aria-label={chat.sound.mute} title={muted ? chat.sound.unmute : chat.sound.mute} className={iconButton}>
          {muted ? <SpeakerSlashIcon size={15} aria-hidden /> : <SpeakerHighIcon size={15} aria-hidden />}
        </button>
        <button type="button" onClick={startOver} disabled={!messages.length} aria-label={chat.reset} title={chat.reset} className={iconButton}>
          <ArrowCounterClockwiseIcon size={15} aria-hidden />
        </button>
        <button type="button" onClick={() => onClose(true)} aria-label={chat.close} title={chat.close} className={iconButton}>
          <XIcon size={15} aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={list} onScroll={onScroll} role="log" aria-label={chat.name} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5">
        <div className={`${bubble} self-start border-b1 bg-s2`}>
          <RichText text={chat.greeting} known={known} projects={projects} allowLeadForm={false} go={go} onFollow={follow} />
        </div>
        {messages.map((m) =>
          m.role === 'user' ? (
            <p key={m.id} className={`${bubble} self-end border-wash-b bg-wash whitespace-pre-wrap`}>
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="group flex max-w-[88%] flex-col items-start gap-1 self-start">
              <div className={`${bubble} max-w-full border-b1 bg-s2`}>
                {m.pending && !m.content ? (
                  <Typing />
                ) : (
                  <RichText text={m.content} known={known} projects={projects} allowLeadForm={m.id === formOwner} leadDraft={draft} go={go} onFollow={follow} />
                )}
              </div>
              {!m.pending && (
                // The latest reply's buttons always show; older ones on hover or focus, and always on touch.
                <div className={`flex gap-0.5 ${m === last ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100'}`}>
                  <button type="button" onClick={() => void copy(m.id, m.content)} aria-label={copied === m.id ? chat.actions.copied : chat.actions.copy} title={chat.actions.copy} className={actionButton}>
                    {copied === m.id ? <CheckIcon size={13} aria-hidden /> : <CopyIcon size={13} aria-hidden />}
                    {copied === m.id && <span aria-hidden>{chat.actions.copied}</span>}
                  </button>
                  {m.failed && m === last && (
                    <button type="button" onClick={askAgain} disabled={sending} className={actionButton}>
                      <ArrowClockwiseIcon size={13} aria-hidden />
                      {chat.actions.retry}
                    </button>
                  )}
                </div>
              )}
            </div>
          ),
        )}
      </div>
      {!atEnd && (
        <button
          type="button"
          onClick={toEnd}
          className="absolute bottom-2.5 left-1/2 inline-flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full border border-b2 bg-s2 px-2.5 py-1 text-[11.5px] font-medium text-ink2 shadow-(--palette-shadow) hover:text-ink"
        >
          <ArrowDownIcon size={12} weight="bold" aria-hidden />
          {chat.latest}
        </button>
      )}
      </div>

      <div data-chips className="flex flex-wrap gap-1.5 border-t border-b1 px-4 py-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={sending}
            onClick={() => ask(s)}
            className="cursor-pointer rounded-full border border-b2 bg-chip px-2.5 py-1 text-[12px] font-medium text-ink2 hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-40 disabled:hover:border-b2 disabled:hover:text-ink2"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="border-t border-b1 px-4 pt-3 pb-2"
      >
        <div className="flex items-end gap-2 rounded-xl border border-b1 bg-s1 p-1.5 focus-within:border-b2">
          <textarea
            ref={input}
            rows={1}
            value={typed}
            maxLength={MAX_LENGTH.user}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            aria-label={chat.message}
            placeholder={chat.placeholder}
            autoComplete="off"
            className="max-h-30 min-h-8 min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13.5px] leading-normal text-ink outline-none placeholder:text-ink3"
          />
          {sending ? (
            <button type="button" onClick={stop} aria-label={chat.stop} title={chat.stop} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-b2 bg-chip text-ink">
              <StopIcon size={14} weight="fill" aria-hidden />
            </button>
          ) : (
            <button type="submit" disabled={!typed.trim()} aria-label={chat.send} title={chat.send} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-accent bg-accent text-on-accent disabled:cursor-default disabled:opacity-50">
              <ArrowUpIcon size={15} weight="bold" aria-hidden />
            </button>
          )}
        </div>
        <p aria-hidden className="mt-1.5 hidden items-center justify-between px-1 font-mono text-[10px] text-ink3 shell:flex">
          <span className="inline-flex items-center gap-1">
            <ArrowElbowDownLeftIcon size={11} /> {chat.hint.send} · shift+↵ {chat.hint.newline}
          </span>
          <span>{chat.hint.open}</span>
        </p>
      </form>
      <p className="border-t border-b1 px-4 py-2 text-[11.5px] text-ink3">{chat.privacy[shownMode === 'live' ? 'ai' : 'site']}</p>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  )
}
