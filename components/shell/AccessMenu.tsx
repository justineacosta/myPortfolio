'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowCounterClockwiseIcon, PersonArmsSpreadIcon, XIcon } from '@phosphor-icons/react/ssr'
import { access } from '@/data/access'
import { useA11yPrefs } from '@/hooks/useA11yPrefs'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { placePanel } from '@/lib/popover'

const SIZE_TEXT = ['text-sm', 'text-base', 'text-lg'] as const

/**
 * The accessibility menu (kape AccessMenu.tsx, spec §6, §11), beside Kraft's
 * theme button. One button opens a small panel: text size, stronger
 * contrast, motion off and underlined links. Each switch applies at once and
 * is remembered, and lib/boot.ts re-applies it before the first paint. The
 * panel is portalled to <body> so no scroll box clips it. Escape, the close
 * button, a click elsewhere or a resize closes it. A dot on the button shows
 * that something is switched on.
 */
export default function AccessMenu({ size = 38, className = '' }: { size?: 38 | 40; className?: string }) {
  const [open, setOpen] = useState(false)
  const prefs = useA11yPrefs()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  const close = useCallback((refocus: boolean) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }, [])

  // Place the panel before it paints, then hand it focus.
  useLayoutEffect(() => {
    const el = panel.current
    if (!open || !el || !button.current) return
    const { top, left, maxHeight } = placePanel(button.current.getBoundingClientRect(), el.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    el.style.top = `${top}px`
    el.style.left = `${left}px`
    el.style.maxHeight = maxHeight === undefined ? '' : `${maxHeight}px`
    el.querySelector<HTMLElement>('button')?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      close(true)
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panel.current?.contains(t) || button.current?.contains(t)) return
      close(false)
    }
    const onResize = () => close(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open, close])

  const changed = prefs.text !== 'md' || prefs.contrast || prefs.motion || prefs.links
  const box = size === 40 ? 'size-10 rounded-xl' : 'size-[38px] rounded-[11px]'

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={access.button}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={`relative grid shrink-0 cursor-pointer place-items-center border border-b1 bg-s2 text-ink2 transition-all duration-250 hover:-translate-y-0.5 hover:border-b2 hover:text-accent ${box} ${className}`}
      >
        <PersonArmsSpreadIcon size={size === 40 ? 16 : 17} weight="fill" aria-hidden />
        {changed && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={access.title}
            className="fixed top-0 left-0 z-50 flex w-[min(300px,calc(100vw-32px))] animate-rise flex-col overflow-y-auto gap-3 rounded-[18px] border border-b2 bg-linear-to-b from-s2 to-s1 p-3.5 text-left text-ink shadow-(--palette-shadow)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold tracking-[-.01em]">{access.title}</span>
              <button
                type="button"
                onClick={() => close(true)}
                aria-label={access.close}
                className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink"
              >
                <XIcon size={15} aria-hidden />
              </button>
            </div>
            <div role="group" aria-labelledby={`${id}-size`}>
              <span id={`${id}-size`} className="mb-1.5 block font-mono text-[10px] tracking-[.14em] text-ink3">
                {access.textSize}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {access.sizes.map((s, i) => {
                  const on = prefs.text === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${s.label}, ${s.hint}`}
                      onClick={() => savePrefs({ ...prefs, text: s.value })}
                      className={`h-10 cursor-pointer rounded-[10px] border font-bold ${SIZE_TEXT[i]} ${on ? 'border-accent bg-accent text-on-accent' : 'border-b1 bg-s2 text-ink hover:border-b2'}`}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <ul className="flex flex-col gap-1">
              {access.switches.map((s) => {
                const on = prefs[s.key]
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => savePrefs({ ...prefs, [s.key]: !on })}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] px-2.5 py-[9px] text-left hover:bg-hover"
                    >
                      <span className="flex flex-col gap-px">
                        <span className="text-[13.5px] font-medium">{s.label}</span>
                        <span className="text-xs text-ink3">{s.desc}</span>
                      </span>
                      <span aria-hidden className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-s3'}`}>
                        <span className={`absolute top-[3px] left-[3px] size-4 rounded-full transition-transform ${on ? 'translate-x-4 bg-on-accent' : 'bg-ink3'}`} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={() => savePrefs(DEFAULT_PREFS)}
              disabled={!changed}
              className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-b1 bg-chip text-[12.5px] font-medium text-ink2 hover:border-b2 disabled:cursor-default disabled:opacity-40"
            >
              <ArrowCounterClockwiseIcon size={14} aria-hidden />
              {access.reset}
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
