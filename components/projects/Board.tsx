'use client'

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { ArrowUpRightIcon, ArrowsClockwiseIcon, HandPointingIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import Shot from '@/components/ui/Shot'
import { projects } from '@/data/projects'
import { pushHash } from '@/lib/hash'
import { prefersReducedMotion } from '@/lib/motion'

const CARD =
  'relative flex flex-col gap-2.5 overflow-hidden rounded-[20px] border border-b1 bg-linear-to-b from-s1 to-s2 p-5 text-left text-ink transition-[translate,scale,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:from-s2 hover:to-hover hover:shadow-[0_28px_64px_-30px_var(--washB)] active:scale-[.988]'
const TILE = 'grid size-[38px] place-items-center rounded-xl border border-b1 bg-chip'
const TITLE = 'text-[clamp(17px,2cqw,22px)] font-semibold tracking-[-.025em]'
const BODY = 'text-[13px] leading-[1.55] text-ink3'
const CTA = 'flex items-center gap-[7px] font-mono text-[10px] tracking-[.12em] text-accent'
const GAP = 'gap-[clamp(11px,1.3cqw,18px)]'

/** Kraft's fan of site tiles on the Funnels card (Kraft Projects Board.dc.html:110-114); index 2 is the front tile. */
const FAN = [
  'translateX(-50%) translateX(-112px) translateY(26px) rotate(-26deg)',
  'translateX(-50%) translateX(-58px) translateY(7px) rotate(-13deg)',
  'translateX(-50%) rotate(0deg)',
  'translateX(-50%) translateX(58px) translateY(7px) rotate(13deg)',
  'translateX(-50%) translateX(112px) translateY(26px) rotate(26deg)',
]

/**
 * A card is a real #view link, so it can open in a new tab. A plain click goes
 * through pushHash, the history.pushState that Next patches, so the entry
 * carries Next's state and Back from another page lands on Projects again.
 */
function openView(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  pushHash(e.currentTarget.hash.slice(1))
}

/**
 * The Projects board (Kraft Projects Board.dc.html:43-130). Every card is a
 * link to its sub-view's hash, so it opens in place, can be opened in a new
 * tab, and Back closes it. A plain click goes through Next's history
 * (openView). One label follows the pointer and names the
 * action of the card under it (data-case). There is none on touch or with
 * reduced motion.
 */
export default function Board() {
  const c = projects.cards
  const cue = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || prefersReducedMotion()) return
    const box = e.currentTarget.getBoundingClientRect()
    const hit = (e.target as Element).closest<HTMLElement>('[data-case]')
    setLabel(hit?.dataset.case ?? '')
    cue.current?.style.setProperty(
      'transform',
      `translate3d(${e.clientX - box.left + 16}px,${e.clientY - box.top + 16}px,0)`,
    )
  }

  return (
    <div className="relative" onPointerMove={track} onPointerLeave={() => setLabel('')}>
      <Frame lit={{ x: '18%', alpha: 0.4, stop: '58%', from: 's2' }} className={`relative flex flex-col ${GAP} p-[clamp(11px,1.3cqw,18px)]`}>
        <div className="absolute top-0 left-1/2 z-2 -translate-x-1/2 -translate-y-1/2">
          <span className="flex animate-nudge items-center gap-2 rounded-full border border-b1 bg-s1 px-3.5 py-2 font-mono text-[10.5px] tracking-[.14em] whitespace-nowrap text-ink2 shadow-[0_8px_24px_-16px_var(--washB)]">
            <HandPointingIcon size={14} aria-hidden className="text-accent" />
            {projects.nudge}
          </span>
        </div>

        <div className={`flex flex-wrap ${GAP}`}>
          <a href="#reel" onClick={openView} data-case={c.reel.cue} className={`${CARD} min-w-[min(270px,100%)] flex-[3_1_420px]`}>
            <span aria-hidden className={TILE}>
              <c.reel.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.reel.title}</h2>
            <p className={`${BODY} max-w-[340px]`}>{c.reel.body}</p>
            <span className={CTA}>
              {c.reel.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
            <div aria-hidden className="relative mt-1.5 -mr-5 -mb-5 h-[clamp(150px,17cqw,220px)]">
              <div className="absolute top-[-10px] left-[18%] h-[64%] w-[78%] overflow-hidden rounded-t-xl border border-b-0 border-b1 bg-s0 opacity-50">
                <Shot src={c.reel.peek[0]} hint={c.reel.peekHint} />
              </div>
              <div className="absolute top-9 right-[-8px] bottom-[-14px] left-[30%] overflow-hidden rounded-xl border border-b2 bg-s0 shadow-(--peek-shadow)">
                <Shot src={c.reel.peek[1]} hint={c.reel.peekHint} />
              </div>
            </div>
          </a>

          <a href="#build-plan" onClick={openView} data-case={c.plan.cue} className={`${CARD} min-w-[min(250px,100%)] flex-[2_1_300px]`}>
            <span aria-hidden className={TILE}>
              <c.plan.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.plan.title}</h2>
            <p className={BODY}>{c.plan.body}</p>
            <div className="mt-auto flex flex-col gap-3 rounded-[14px] border border-b1 bg-s0 p-4">
              <span className="font-mono text-[9.5px] tracking-[.14em] text-ink3">{c.plan.kicker}</span>
              <span className="text-[15px] font-semibold tracking-[-.02em]">{c.plan.heading}</span>
              <div className="flex flex-wrap gap-1.5">
                {c.plan.steps.map((s, i) => (
                  <span
                    key={s}
                    className={`rounded-lg border px-2.5 py-[5px] text-[11.5px] font-medium ${i === c.plan.steps.length - 1 ? 'border-accent bg-accent text-on-accent' : 'border-b1 bg-s1 text-ink2'}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div aria-hidden className="flex flex-col gap-[7px]">
                <span className="h-[5px] rounded-full bg-hover" />
                <span className="h-[5px] w-[72%] rounded-full bg-hover" />
              </div>
            </div>
          </a>

          <div className="flex min-w-[min(250px,100%)] flex-[2_1_300px] flex-col gap-[clamp(8px,1cqw,12px)]">
            {projects.writeups.map((w) => (
              <a
                key={w.view}
                href={`#${w.view}`}
                onClick={openView}
                data-case={w.cue}
                className="flex flex-1 items-start gap-3 rounded-[18px] border border-b1 bg-linear-to-b from-s1 to-s2 p-4 text-left text-ink transition-[translate,border-color,box-shadow] duration-350 hover:-translate-y-0.5 hover:border-b2 hover:from-s2 hover:to-hover hover:shadow-[0_22px_50px_-32px_var(--washB)]"
              >
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-b1 bg-chip">
                  <w.icon size={17} className="text-accent" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-mono text-[9px] tracking-[.14em] text-accent">{w.kicker}</span>
                  <h2 className="text-[14.5px] font-semibold tracking-[-.02em]">{w.title}</h2>
                  <p className="text-xs leading-normal text-ink3">{w.desc}</p>
                </div>
                <span aria-hidden className="ml-auto grid size-7 shrink-0 place-items-center rounded-[9px] border border-b1 text-ink3">
                  <ArrowUpRightIcon size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className={`flex flex-wrap ${GAP}`}>
          <a href="#sites" onClick={openView} data-case={c.sites.cue} className={`${CARD} min-w-[min(260px,100%)] flex-[2_1_320px]`}>
            <span aria-hidden className={TILE}>
              <c.sites.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.sites.title}</h2>
            <p className={BODY}>{c.sites.body}</p>
            <span className={CTA}>
              {c.sites.cta} <ArrowsClockwiseIcon size={13} aria-hidden />
            </span>
            <div aria-hidden className="relative mt-2.5 h-[clamp(150px,16cqw,200px)] overflow-hidden">
              {FAN.map((transform, i) => (
                <div
                  key={transform}
                  style={{ transform }}
                  className={`absolute left-1/2 aspect-[3/4] h-[84%] origin-bottom overflow-hidden rounded-[11px] border bg-s0 ${i === 2 ? 'bottom-4 border-b2 shadow-(--peek-shadow)' : 'bottom-1 border-b1 shadow-(--tile-shadow)'}`}
                >
                  <Shot src={projects.sitesView.sites[i].thumb} hint={c.sites.fanHint} sizes="120px" />
                </div>
              ))}
            </div>
          </a>

          <a href="#ai-agents" onClick={openView} data-case={c.agents.cue} className={`${CARD} min-w-[min(270px,100%)] flex-[3_1_380px]`}>
            <span aria-hidden className={TILE}>
              <c.agents.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.agents.title}</h2>
            <p className={`${BODY} max-w-[420px]`}>{c.agents.body}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-3.5">
              {c.agents.chips.map((a) => (
                <span key={a.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-3 py-2 text-[12.5px] text-ink2">
                  <a.icon size={14} aria-hidden className="text-ink3" />
                  {a.name}
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                </span>
              ))}
            </div>
            <span className={CTA}>
              {c.agents.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
          </a>
        </div>
      </Frame>

      <div
        ref={cue}
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 z-30 transition-[transform,opacity] duration-100 ease-linear ${label ? 'opacity-100' : 'opacity-0'}`}
      >
        {label && (
          <span className="flex items-center gap-[7px] rounded-full bg-accent px-3 py-[7px] font-mono text-[10px] tracking-[.12em] whitespace-nowrap text-on-accent shadow-[0_14px_34px_-16px_var(--glow)]">
            <ArrowUpRightIcon size={12} />
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
