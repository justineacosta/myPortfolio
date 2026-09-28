import { useState, type CSSProperties } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react/ssr'
import Shot from '@/components/ui/Shot'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects } from '@/data/projects'
import StageBar from './StageBar'

/**
 * Kraft's workflow reel (Kraft Projects Board.dc.html:241-265): screenshots
 * marching past on a dimmed stage. The row is drawn twice for a seamless
 * loop, and the copy is hidden from assistive tech. A click on the empty
 * stage closes it, as Kraft's scrim did. A button pauses it too, for
 * keyboard and touch (WCAG 2.2.2).
 */
export default function ReelView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const r = projects.reel
  const [paused, setPaused] = useState(false)
  const loop = [...r.shots, ...r.shots]
  return (
    <ViewDialog open={open} onClose={onClose} label={r.label} className="view--stage">
      <StageBar kicker={r.kicker} hint={r.hint} onClose={onClose}>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? r.playLabel : r.pauseLabel}
          className="reel-pause flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-veil-line bg-veil-chip px-3.5 font-mono text-[10.5px] tracking-[.14em] text-veil-ink transition-colors duration-200 hover:bg-veil-chip-hover"
        >
          {paused ? <PlayIcon size={14} weight="fill" aria-hidden /> : <PauseIcon size={14} weight="fill" aria-hidden />}
          {paused ? r.play : r.pause}
        </button>
      </StageBar>
      <div data-backdrop className="reel relative flex min-h-0 flex-1 items-center overflow-hidden">
        <div
          data-backdrop
          data-paused={paused || undefined}
          className="reel-row flex h-full w-max items-center gap-7 px-3.5"
          style={{ '--marq': `${r.seconds}s` } as CSSProperties}
        >
          {loop.map((s, i) => (
            <figure
              key={`${s.label}-${i}`}
              aria-hidden={i >= r.shots.length || undefined}
              className="m-0 flex h-[min(72%,580px)] w-[min(72vw,860px)] shrink-0 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--shot-shadow)"
            >
              <figcaption className="flex items-center gap-[7px] border-b border-b1 bg-s0 px-3.5 py-2.5">
                <span aria-hidden className="size-2.5 rounded-full bg-mac-r" />
                <span aria-hidden className="size-2.5 rounded-full bg-mac-y" />
                <span aria-hidden className="size-2.5 rounded-full bg-mac-g" />
                <span className="ml-2.5 font-mono text-[10.5px] text-ink3">{s.label}</span>
              </figcaption>
              <div className="relative min-h-0 flex-1 bg-s1">
                <Shot src={s.src} hint={r.slotHint} alt={s.label} sizes="72vw" />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </ViewDialog>
  )
}
