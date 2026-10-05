'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowSquareOutIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { casePagesFor, type CasePageId } from '@/data/cases/pages'
import { projects, type Site } from '@/data/projects'

type Check = { src: string; ok: boolean }

type Tab = 'site' | CasePageId

const CHROME_BUTTON =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover'

/**
 * Kraft's site preview (Kraft Projects Board.dc.html:288-311, kape
 * FunnelModal.tsx). A browser window stacks on the sites view and loads the
 * real page, so a visitor never leaves. The page is checked before it loads:
 * if it is missing, the window says where the file goes, and "Open in new tab" is
 * always there (spec §12). It is closed by Close, Esc, or leaving the sites view.
 * A site with case pages gets a tab row: its own page first, then the five
 * generated pages (data/cases/pages.ts, imported alone to keep every site's
 * content out of the client bundle). Each opens on Site.
 */
export default function SitePreview({ site, onClose }: { site: Site | null; onClose: () => void }) {
  const p = projects.sitesView.preview
  // The last site shown, so the window keeps its content while it closes. Opening it
  // (null to a site) starts on the Site tab, so a closed tab never comes back.
  const [shown, setShown] = useState(site)
  const [last, setLast] = useState(site)
  const [tab, setTab] = useState<Tab>('site')
  if (site !== last) {
    setLast(site)
    if (site) {
      setShown(site)
      setTab('site')
    }
  }
  const [check, setCheck] = useState<Check | null>(null)
  const ids = useId()
  const tabs = useRef<HTMLDivElement>(null)

  const pages = shown ? casePagesFor(shown.file) : []
  const page = tab === 'site' ? undefined : pages.find((c) => c.id === tab)
  const src = shown ? (page ? page.src : shown.src) : ''
  const open = !!site

  useEffect(() => {
    if (!open || !src) return
    let live = true
    fetch(src, { method: 'HEAD' })
      .then((r) => live && setCheck({ src, ok: r.ok }))
      .catch(() => live && setCheck({ src, ok: false }))
    return () => {
      live = false
    }
  }, [open, src])

  const checked = open && check?.src === src
  const missing = checked && !check.ok

  const order: Tab[] = ['site', ...pages.map((c) => c.id)]
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = order.indexOf(tab)
    const next = e.key === 'ArrowRight' ? (at + 1) % order.length : e.key === 'ArrowLeft' ? (at - 1 + order.length) % order.length : e.key === 'Home' ? 0 : e.key === 'End' ? order.length - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setTab(order[next])
    tabs.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
  }
  const tabClass = (on: boolean) =>
    `shrink-0 cursor-pointer border-b-2 px-3 py-2 text-[13px] transition-colors duration-200 ${on ? 'border-ink text-ink' : 'border-transparent text-ink2 hover:text-ink'}`

  return (
    <ViewDialog open={!!site} onClose={onClose} label={shown ? `${shown.name} ${p.label}` : p.label} className="view--window">
      {shown && (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
          <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="mx-2 min-w-0 flex-1 truncate rounded-full border border-b1 bg-s1 px-3 py-[7px] font-mono text-[11.5px] text-ink2">
              {window.location.host}
              {src}
            </span>
            <a href={src} target="_blank" rel="noopener" aria-label={p.newTab} className={CHROME_BUTTON}>
              <ArrowSquareOutIcon size={17} aria-hidden />
            </a>
            <button type="button" onClick={onClose} aria-label={p.close} className={CHROME_BUTTON}>
              <XIcon size={17} aria-hidden />
            </button>
          </div>
          {pages.length > 0 && (
            <div
              ref={tabs}
              role="tablist"
              aria-label={p.tabsLabel}
              onKeyDown={onTabKey}
              className="flex gap-1 overflow-x-auto whitespace-nowrap border-b border-b1 bg-s0 px-3.5"
            >
              {order.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`${ids}-${id}`}
                  aria-selected={id === tab}
                  aria-controls={`${ids}-panel`}
                  tabIndex={id === tab ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={tabClass(id === tab)}
                >
                  {i === 0 ? p.siteTab : pages[i - 1].label}
                </button>
              ))}
            </div>
          )}
          <div
            id={`${ids}-panel`}
            role={pages.length > 0 ? 'tabpanel' : undefined}
            aria-labelledby={pages.length > 0 ? `${ids}-${tab}` : undefined}
            className="relative flex-1 bg-s1"
          >
            {checked && !missing && !page && (
              // Sandboxed without same-origin: a dropped-in client export may carry third-party scripts.
              <iframe
                key={src}
                src={src}
                title={shown.name}
                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                className="absolute inset-0 size-full border-0"
              />
            )}
            {checked && !missing && page && (
              // Ours and same-origin: no sandbox, so the page can follow the portfolio's theme, contrast and performance settings from window.parent.
              <iframe key={src} src={src} title={`${shown.name} · ${page.label}`} className="absolute inset-0 size-full border-0 bg-bg" />
            )}
            {missing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center text-ink2">
                <UploadSimpleIcon size={26} aria-hidden />
                <p className="text-sm">
                  {p.upload} <strong className="text-ink">{src.split('/').pop()}</strong> {p.uploadTail}
                </p>
                <span className="font-mono text-[10.5px] tracking-[.12em] opacity-60">{p.uploadNote}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </ViewDialog>
  )
}
