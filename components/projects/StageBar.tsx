import type { ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'

type Props = { kicker: string; hint?: string; onClose: () => void; children?: ReactNode }

/** The strip across the top of a dark-stage view (Kraft Projects Board.dc.html:244-248, 270-273). `children` are extra controls beside Close. */
export default function StageBar({ kicker, hint, onClose, children }: Props) {
  return (
    <div className="relative flex items-center gap-3 px-5 py-4 text-veil-ink">
      <span className="font-mono text-[10.5px] tracking-[.16em] opacity-70">{kicker}</span>
      {hint && <span className="font-mono text-[10.5px] tracking-[.16em] opacity-45 max-shell:hidden">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onClose}
          aria-label={projects.close}
          className="grid size-11 cursor-pointer place-items-center rounded-xl border border-veil-line bg-veil-chip text-veil-ink transition-colors duration-200 hover:bg-veil-chip-hover"
        >
          <XIcon size={18} aria-hidden />
        </button>
      </div>
    </div>
  )
}
