'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { PaperPlaneRightIcon, XIcon } from '@phosphor-icons/react/ssr'
import { useShellNav } from '@/components/shell/NavigationProvider'
import { chat } from '@/data/chat'
import { HANDOFF_EVENT, saveHandoff } from '@/lib/chat/handoff'
import { parseLinks } from '@/lib/chat/reply'
import type { ChatTurn } from '@/lib/chat/validate'
import { PANEL_DOM_ID } from './ChatLauncher'

const TITLE_ID = `${PANEL_DOM_ID}-title`
const INPUT_ID = `${PANEL_DOM_ID}-input`
/** The dialogs and menus the site draws (the palette, the accessibility menu, a view's native dialog). */
const OVERLAY = '[role="dialog"], [role="menu"], dialog'
const bubble = 'max-w-[88%] rounded-2xl border px-3 py-2 text-[13.5px] leading-normal whitespace-pre-wrap'
const iconButton = 'grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink'

/** Whether `el` is inside a dialog or menu other than this panel. */
function inOtherOverlay(el: EventTarget | null, panel: HTMLElement | null): boolean {
  const box = el instanceof Element ? el.closest(OVERLAY) : null
  return box !== null && box !== panel
}

/** A reply as text and links: a known site path goes through the shell router, a file stays a plain anchor. */
function Reply({ text, known, go, onFollow }: { text: string; known: ReadonlySet<string>; go: (href: string) => void; onFollow: () => void }) {
  return parseLinks(text, known).map((seg, i) => {
    if (!('href' in seg)) return seg.text
    const { href } = seg
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (/\.html?$/.test(href)) {
        // Let the browser follow the file first; unmounting the anchor inside its own click could cancel that.
        setTimeout(onFollow, 0)
        return
      }
      e.preventDefault()
      go(href)
      onFollow()
    }
    return (
      <a key={i} href={href} onClick={onClick} className="text-accent underline underline-offset-2">
        {seg.text}
      </a>
    )
  })
}

/** The chat panel: a card above the launcher on desktop, a full-height sheet on phones. A non-modal dialog, so the page behind stays usable. */
export default function ChatPanel({
  turns,
  streaming,
  contact,
  error,
  capped,
  send,
  known,
  onClose,
}: {
  turns: ChatTurn[]
  streaming: string | null
  contact: boolean
  error: string | null
  capped: boolean
  send: (text: string) => Promise<void>
  known: ReadonlySet<string>
  onClose: (refocus: boolean) => void
}) {
  const { go } = useShellNav()
  const [draft, setDraft] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => input.current?.focus(), [])

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

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight
  }, [turns, streaming, error])

  const last = turns[turns.length - 1]
  // Only a finished reply is announced, never the one still arriving.
  const announced = streaming === null && last?.role === 'assistant' ? parseLinks(last.content, known).map((s) => s.text).join('') : ''

  const handoff = () => {
    saveHandoff(turns)
    // On /contact the form is already mounted and only scrolls into view, so it is told to take the text.
    window.dispatchEvent(new Event(HANDOFF_EVENT))
    go('/contact')
    onClose(false)
  }
  // Following a reply link leaves the chat; focus stays with the page it opens.
  const follow = () => onClose(false)
  const submit = () => {
    if (streaming !== null || !draft.trim()) return
    void send(draft.trim())
    setDraft('')
  }

  return (
    <div
      ref={panel}
      id={PANEL_DOM_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={TITLE_ID}
      data-a11y-scale
      className="fixed inset-0 z-40 flex animate-rise flex-col overflow-hidden bg-linear-to-b from-s2 to-s1 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ink shell:inset-auto shell:right-5 shell:bottom-[124px] shell:h-[480px] shell:max-h-[calc(100dvh-144px)] shell:w-[360px] shell:rounded-2xl shell:border shell:border-b2 shell:pt-0 shell:pb-0 shell:shadow-(--palette-shadow)"
    >
      <div className="flex items-center gap-2 border-b border-b1 px-4 py-3">
        <h2 id={TITLE_ID} className="text-[15px] font-semibold tracking-[-.01em]">
          {chat.title}
        </h2>
        <button type="button" onClick={() => onClose(true)} aria-label={chat.close} title={chat.close} className={`${iconButton} ml-auto`}>
          <XIcon size={15} aria-hidden />
        </button>
      </div>

      <div ref={list} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5">
        <p className={`${bubble} self-start border-b1 bg-s2 text-ink`}>{chat.greeting}</p>
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {chat.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => void send(s)} className="cursor-pointer rounded-full border border-b2 bg-chip px-3 py-1.5 text-[12.5px] font-medium text-ink2 hover:border-accent hover:text-accent">
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <p key={i} className={`${bubble} ${t.role === 'user' ? 'self-end border-wash-b bg-wash' : 'self-start border-b1 bg-s2'} text-ink`}>
            {t.role === 'user' ? t.content : <Reply text={t.content} known={known} go={go} onFollow={follow} />}
          </p>
        ))}
        {streaming !== null && <p className={`${bubble} self-start border-b1 bg-s2 text-ink`}>{streaming ? <Reply text={streaming} known={known} go={go} onFollow={follow} /> : '…'}</p>}
        {error && (
          <p role="alert" className="text-[13px] text-ink2">
            {error}
          </p>
        )}
        {(contact || capped || error) && (
          <button type="button" onClick={handoff} className="cursor-pointer self-start rounded-xl border border-accent bg-accent px-3 py-2 text-[13px] font-semibold text-on-accent">
            {chat.handoff}
          </button>
        )}
      </div>

      {capped ? (
        <p className="border-t border-b1 px-4 py-3 text-[13px] text-ink2">{chat.capped}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex items-center gap-2 border-t border-b1 px-4 py-3"
        >
          <input ref={input} id={INPUT_ID} type="text" maxLength={500} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={chat.placeholder} placeholder={chat.placeholder} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-xl border border-b1 bg-s1 px-3 text-[13.5px] text-ink placeholder:text-ink3" />
          <button type="submit" disabled={streaming !== null} aria-label={chat.send} title={chat.send} className="grid size-10 cursor-pointer place-items-center rounded-xl border border-accent bg-accent text-on-accent disabled:cursor-default disabled:opacity-50">
            <PaperPlaneRightIcon size={16} weight="fill" aria-hidden />
          </button>
        </form>
      )}
      <p className="border-t border-b1 px-4 py-2 text-[11.5px] text-ink3">{chat.privacy}</p>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  )
}
