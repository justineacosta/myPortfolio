'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOutIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'

type Check = { src: string; ok: boolean }

const CHROME_BUTTON =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover'

/**
 * Kraft's site preview (Kraft Projects Board.dc.html:288-311, kape
 * FunnelModal.tsx). A browser window stacks on the sites view and loads the
 * real page, so a visitor never leaves. The page is checked before it loads:
 * if it is missing, the window says where the file goes, and "Open in new tab" is
 * always there (spec §12). It is closed by Close, Esc, or leaving the sites view.
 */
export default function SitePreview({ site, onClose }: { site: Site | null; onClose: () => void }) {
  const p = projects.sitesView.preview
  // The last site shown, so the window keeps its content while it closes.
  const [shown, setShown] = useState(site)
  if (site && site !== shown) setShown(site)
  const [check, setCheck] = useState<Check | null>(null)

  useEffect(() => {
    if (!site) return
    let live = true
    fetch(site.src, { method: 'HEAD' })
      .then((r) => live && setCheck({ src: site.src, ok: r.ok }))
      .catch(() => live && setCheck({ src: site.src, ok: false }))
    return () => {
      live = false
    }
  }, [site])

  const checked = !!site && check?.src === site.src
  const missing = checked && !check.ok
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
              {shown.src}
            </span>
            <a href={shown.src} target="_blank" rel="noopener" aria-label={p.newTab} className={CHROME_BUTTON}>
              <ArrowSquareOutIcon size={17} aria-hidden />
            </a>
            <button type="button" onClick={onClose} aria-label={p.close} className={CHROME_BUTTON}>
              <XIcon size={17} aria-hidden />
            </button>
          </div>
          <div className="relative flex-1 bg-s1">
            {checked && !missing && (
              // Sandboxed without same-origin: a dropped-in client export may carry third-party scripts.
              <iframe
                src={site.src}
                title={site.name}
                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                className="absolute inset-0 size-full border-0"
              />
            )}
            {missing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center text-ink2">
                <UploadSimpleIcon size={26} aria-hidden />
                <p className="text-sm">
                  {p.upload} <strong className="text-ink">{shown.file}</strong> {p.uploadTail}
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
