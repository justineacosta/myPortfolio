'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import { filterCommands, type Command } from '@/lib/commands'
import { useShellNav } from './NavigationProvider'

type PaletteCtx = { open: boolean; openPalette: () => void; closePalette: () => void }
const Ctx = createContext<PaletteCtx | null>(null)

export function usePalette(): PaletteCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePalette must be used inside <PaletteProvider>')
  return ctx
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  const openPalette = useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true)
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus())
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) closePalette()
        else openPalette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openPalette, closePalette])

  const value = useMemo(() => ({ open, openPalette, closePalette }), [open, openPalette, closePalette])
  return (
    <Ctx.Provider value={value}>
      {children}
      {open && <PaletteDialog onClose={closePalette} />}
    </Ctx.Provider>
  )
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const { go } = useShellNav()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const hits = filterCommands(query)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // If focus ever leaves the dialog (a browser may drop it on <body>), Escape
  // and Tab still belong to the palette: close, or pull focus back in.
  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => {
      if (dialogRef.current?.contains(document.activeElement)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onDocKey)
    return () => document.removeEventListener('keydown', onDocKey)
  }, [onClose])

  const choose = (c: Command) => {
    onClose()
    go(c.href)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hits.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + step + hits.length) % hits.length)
    } else if (e.key === 'Enter' && e.target === inputRef.current) {
      e.preventDefault()
      const hit = hits[active]
      if (hit) choose(hit)
    } else if (e.key === 'Tab') {
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])') ?? [],
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      ref={dialogRef}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-40 flex animate-rise items-start justify-center bg-scrim px-[18px] pt-[12vh] pb-[18px] backdrop-blur-[6px]"
    >
      <div
        onMouseDown={(e) => {
          // Clicking the card's empty space must not steal focus from the input.
          if (!(e.target as HTMLElement).closest('input, button')) e.preventDefault()
        }}
        className="w-full max-w-[520px] overflow-hidden rounded-[18px] border border-b2 bg-linear-to-b from-s2 to-s1 shadow-(--palette-shadow)"
      >
        <div className="flex items-center gap-2.5 border-b border-b1 px-[17px] py-[15px]">
          <MagnifyingGlassIcon size={16} aria-hidden className="text-accent" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={hits[active] ? `palette-${hits[active].id}` : undefined}
            aria-label="Jump to a section"
            placeholder="Jump to a section…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            className="min-h-8 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[7px] border border-b1 bg-chip px-[9px] py-1.5 font-mono text-[9.5px] tracking-[.08em] text-ink3"
          >
            ESC
          </button>
        </div>
        <div id="palette-results" role="listbox" data-scroll className="max-h-[46vh] overflow-y-auto p-2">
          {hits.length === 0 && <p className="px-[13px] py-3 text-sm text-ink3">No matches</p>}
          {hits.map((c, i) => {
            const Icon = c.icon
            return (
              <button
                key={c.id}
                id={`palette-${c.id}`}
                type="button"
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                onClick={() => choose(c)}
                onMouseMove={() => setActive(i)}
                className={`flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-[13px] py-3 text-left transition-colors duration-200 ${i === active ? 'bg-hover' : 'bg-transparent'}`}
              >
                <Icon size={16} aria-hidden className="text-accent" />
                <span className="text-sm font-medium text-ink">{c.label}</span>
                <span className="ml-auto font-mono text-[9.5px] text-ink3">{c.hint}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
