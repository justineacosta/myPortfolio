'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { ArrowCounterClockwiseIcon, PaperPlaneRightIcon, PlusIcon, StopIcon, XIcon } from '@phosphor-icons/react/ssr'
import { ShellLink, useShellNav } from '@/components/shell/NavigationProvider'
import { assistant } from '@/data/assistant'
import { PANEL_DOM_ID } from './AssistantLauncher'
import { useAssistant, type Entry } from './AssistantProvider'

const TITLE_ID = `${PANEL_DOM_ID}-title`
const INPUT_ID = `${PANEL_DOM_ID}-input`
/** The most a message may run to (the server checks it too). */
const MAX_LENGTH = 1000

/** `[Label](/path)` with nothing but a site path as the target. */
const LINK = /\[([^\]\n]+)\]\(([^()\s]+)\)/g
/** A path on this site: one slash, and not `//host` or `/\host`, which browsers read as another site. */
const SITE_PATH = /^\/(?![/\\])/

/** A reply's text split into plain runs and the `[Label](/path)` site links in it. Nothing else is parsed, and every other bracket stays as typed. */
function parseLinks(text: string): Array<string | { label: string; path: string }> {
  const out: Array<string | { label: string; path: string }> = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    const path = m[2]
    if (!SITE_PATH.test(path)) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push({ label: m[1], path })
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return out
}

/** A reply's text as the panel shows it, with its site links as anchors that go through the shell router. */
function renderText(text: string, go: (href: string) => void): ReactNode[] {
  return parseLinks(text).map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : (
      <a
        key={i}
        href={part.path}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          e.preventDefault()
          go(part.path)
        }}
        className="text-accent underline underline-offset-2"
      >
        {part.label}
      </a>
    ),
  )
}

/** A reply's text as a screen reader should hear it: each site link as its label. */
function plainText(text: string): string {
  return parseLinks(text)
    .map((part) => (typeof part === 'string' ? part : part.label))
    .join('')
}

/** The dialogs and menus the site draws (the ⌘K palette, the accessibility menu, a sub-view's native dialog). */
const OVERLAY = '[role="dialog"], [role="menu"], dialog'

/** Whether `el` is inside another overlay than the assistant's own panel, or is the button of a menu or dialog that is open. */
function inOtherOverlay(el: EventTarget | null, panel: HTMLElement | null): boolean {
  if (!(el instanceof Element)) return false
  const box = el.closest(OVERLAY)
  if (box) return box !== panel
  const trigger = el.closest('[aria-expanded="true"][aria-controls]')
  const target = trigger?.getAttribute('aria-controls')
  const controlled = target ? document.getElementById(target) : null
  return controlled !== null && controlled !== panel && controlled.matches(OVERLAY)
}

/** The chat panel: desktop a card above the launcher, phones a full-height sheet. A non-modal dialog, so the page behind stays usable. */
export default function AssistantPanel({ launcherRef }: { launcherRef: RefObject<HTMLButtonElement | null> }) {
  const { open } = useAssistant()
  return open ? <PanelBody launcherRef={launcherRef} /> : null
}

const bubble = 'max-w-[88%] rounded-2xl border px-3 py-2 text-[13.5px] leading-normal whitespace-pre-wrap'
const note = 'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-b1 bg-chip px-3 py-2 text-[12.5px] text-ink2'
const small = 'cursor-pointer rounded-lg border border-b1 bg-chip px-2.5 py-1 text-[12px] font-medium text-ink2 hover:border-b2 hover:text-ink'

function PanelBody({ launcherRef }: { launcherRef: RefObject<HTMLButtonElement | null> }) {
  const { setOpen, entries, streaming, send, stop, retry, reset } = useAssistant()
  const { go } = useShellNav()
  const [draft, setDraft] = useState('')
  const [announced, setAnnounced] = useState('')
  const [wasStreaming, setWasStreaming] = useState(streaming)
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const stopButton = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const wasStreamingRef = useRef(streaming)

  // A reply that has just finished is put in the live region in one piece, so a screen reader reads it once, not word by word.
  if (wasStreaming !== streaming) {
    setWasStreaming(streaming)
    if (!streaming) {
      const turn = entries.slice(entries.findLastIndex((e) => e.kind === 'user') + 1)
      const reply = turn.findLast((e) => e.kind === 'assistant' && !e.unfinished)
      if (reply && reply.kind === 'assistant') setAnnounced(plainText(reply.text))
    }
  }

  useEffect(() => {
    input.current?.focus()
  }, [])

  // Sending disables the input and swaps Send for Stop, which would drop focus to <body>: keep it in the panel, on Stop, and hand it back to the input when the reply ends, unless the visitor went elsewhere.
  useEffect(() => {
    const active = document.activeElement
    const here = !active || active === document.body || panel.current?.contains(active)
    if (streaming && !wasStreamingRef.current && here) stopButton.current?.focus()
    else if (!streaming && wasStreamingRef.current && here) input.current?.focus()
    wasStreamingRef.current = streaming
  }, [streaming])

  const close = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [setOpen, launcherRef])

  // Esc closes the panel wherever focus is, unless another overlay has taken it: one that already handled the key (the palette
  // calls preventDefault), or one that is open around the target or the focus (the accessibility menu hears Esc on window, after this).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || e.defaultPrevented) return
      if (document.documentElement.hasAttribute('data-dialog')) return
      if (inOtherOverlay(e.target, panel.current) || inOtherOverlay(document.activeElement, panel.current)) return
      e.preventDefault()
      close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [entries])

  const submit = () => {
    if (streaming || !draft.trim()) return
    send(draft)
    setDraft('')
  }

  const last = entries[entries.length - 1]
  const canRetry = !streaming && last !== undefined && (last.kind === 'error' || last.kind === 'user' || (last.kind === 'assistant' && last.unfinished === true))

  return (
    <div
      ref={panel}
      id={PANEL_DOM_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={TITLE_ID}
      data-a11y-scale
      className="fixed inset-0 z-40 flex animate-rise flex-col overflow-hidden bg-linear-to-b from-s2 to-s1 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ink shell:inset-auto shell:right-5 shell:bottom-[124px] shell:h-[560px] shell:max-h-[calc(100dvh-144px)] shell:w-[380px] shell:rounded-2xl shell:border shell:border-b2 shell:pt-0 shell:pb-0 shell:shadow-(--palette-shadow)"
    >
      <div className="flex items-center gap-2 border-b border-b1 px-4 py-3">
        <h2 id={TITLE_ID} className="text-[15px] font-semibold tracking-[-.01em]">
          {assistant.title}
        </h2>
        <span className="rounded-md border border-b1 bg-chip px-1.5 py-px font-mono text-[10px] tracking-[.1em] text-ink3">{assistant.badge}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={reset} aria-label={assistant.newChat} title={assistant.newChat} className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink">
            <PlusIcon size={15} aria-hidden />
          </button>
          <button type="button" onClick={close} aria-label={assistant.close} title={assistant.close} className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink">
            <XIcon size={15} aria-hidden />
          </button>
        </div>
      </div>

      <div ref={list} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5">
        <p className={`${bubble} self-start border-b1 bg-s2 text-ink`}>{assistant.greeting}</p>
        {entries.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {assistant.chips.map((chip) => (
              <button key={chip} type="button" disabled={streaming} onClick={() => send(chip)} className="cursor-pointer rounded-full border border-b2 bg-chip px-3 py-1.5 text-[12.5px] font-medium text-ink2 hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-50">
                {chip}
              </button>
            ))}
          </div>
        )}
        {entries.map((e) => (
          <EntryView key={e.id} entry={e} go={go} />
        ))}
        {canRetry && (
          <button type="button" onClick={retry} className={`${small} inline-flex items-center gap-1.5 self-start`}>
            <ArrowCounterClockwiseIcon size={13} aria-hidden />
            {assistant.retry}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-1.5 border-t border-b1 px-4 pt-3 pb-2"
      >
        <label htmlFor={INPUT_ID} className="font-mono text-[10px] tracking-[.14em] text-ink3">
          {assistant.inputLabel}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={input}
            id={INPUT_ID}
            rows={2}
            maxLength={MAX_LENGTH}
            value={draft}
            disabled={streaming}
            placeholder={assistant.placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            className="min-h-[52px] flex-1 resize-none rounded-xl border border-b1 bg-s1 px-3 py-2 text-[13.5px] text-ink placeholder:text-ink3 disabled:opacity-60"
          />
          {streaming ? (
            <button ref={stopButton} type="button" onClick={stop} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-b2 bg-chip px-3 text-[13px] font-semibold text-ink">
              <StopIcon size={14} weight="fill" aria-hidden />
              {assistant.stop}
            </button>
          ) : (
            <button type="submit" className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-accent bg-accent px-3 text-[13px] font-semibold text-on-accent">
              <PaperPlaneRightIcon size={14} weight="fill" aria-hidden />
              {assistant.send}
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-ink3">
          {assistant.notice} ·{' '}
          <ShellLink href="/privacy" className="underline underline-offset-2 hover:text-ink">
            {assistant.privacy}
          </ShellLink>
        </p>
      </form>

      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  )
}

function ContactLink() {
  return (
    <ShellLink href={assistant.contact.href} className="font-medium text-accent underline underline-offset-2">
      {assistant.contact.label}
    </ShellLink>
  )
}

function EntryView({ entry, go }: { entry: Entry; go: (href: string) => void }) {
  switch (entry.kind) {
    case 'user':
      return <p className={`${bubble} self-end border-wash-b bg-wash text-ink`}>{entry.text}</p>
    case 'assistant':
      return (
        <div className="flex flex-col items-start gap-1">
          <p className={`${bubble} border-b1 bg-s2 text-ink`}>{renderText(entry.text, go)}</p>
          {entry.unfinished && <p className="px-1 text-[12px] text-ink3">{assistant.unfinished}</p>}
        </div>
      )
    case 'navigate':
      return <p className={note}>{`${assistant.going} ${entry.label}…`}</p>
    case 'lead':
      return (
        <p className={note}>
          <span>{entry.ok ? assistant.leadOk : assistant.leadFailed}</span>
          <ContactLink />
        </p>
      )
    case 'error':
      return (
        <p className={note}>
          <span>{entry.text}</span>
          <ContactLink />
        </p>
      )
  }
}
