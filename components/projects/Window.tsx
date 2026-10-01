import type { ReactNode } from 'react'
import { ArrowSquareOutIcon, XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects } from '@/data/projects'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode; href?: string; flush?: boolean }

const CHROME_BUTTON =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover'

/**
 * Kraft's document window (Kraft Projects Board.dc.html:190-238): traffic
 * lights, the title (or the page's address) in an address field, Close, and
 * a scrolling body. A window that shows a page (`href`) also links it into a
 * new tab, and `flush` hands its whole body to that page. Close takes focus
 * when it opens.
 */
export default function Window({ open, onClose, title, children, href, flush = false }: Props) {
  return (
    <ViewDialog open={open} onClose={onClose} label={title} className="view--window">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
        <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
          <span className={`mx-2 min-w-0 flex-1 truncate rounded-[7px] border border-b1 bg-s1 px-3 py-1.5 text-ink2 ${href ? 'font-mono text-[11.5px]' : 'text-[12.5px]'}`}>
            {href ?? title}
          </span>
          {href && (
            // Same-origin page, so keeping the opener is safe, and it lets the new tab inherit this tab's
            // sessionStorage: the site's performance setting (lib/perf.ts) reaches the standalone page.
            <a href={href} target="_blank" rel="opener" aria-label={projects.openNewTab} className={CHROME_BUTTON}>
              <ArrowSquareOutIcon size={17} aria-hidden />
            </a>
          )}
          <button type="button" onClick={onClose} aria-label={projects.close} data-autofocus className={CHROME_BUTTON}>
            <XIcon size={17} aria-hidden />
          </button>
        </div>
        {flush ? (
          <div className="relative min-h-0 flex-1 bg-bg">{children}</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-[30px] overflow-y-auto overscroll-contain p-[clamp(16px,2.2vw,30px)]">
            {children}
          </div>
        )}
      </div>
    </ViewDialog>
  )
}
