'use client'

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { ArrowUpRightIcon, HandPointingIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import { projects } from '@/data/projects'
import { pushHash } from '@/lib/hash'
import { prefersReducedMotion } from '@/lib/motion'
import AgentsPreview from './AgentsPreview'
import CaseStudyCard from './CaseStudyCard'
import SitesCard from './SitesCard'
import FlowPeek from './FlowPeek'
import LogoStack from './LogoStack'
import { BODY, CARD, CTA, TITLE } from './styles'
import BrandIcon from '@/components/ui/BrandIcon'

const GAP = 'gap-[clamp(11px,1.3cqw,18px)]'

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

        <CaseStudyCard onOpen={openView} />

        <div className={`flex flex-wrap ${GAP}`}>
          <a href="#automations" onClick={openView} data-case={c.automations.cue} className={`${CARD} min-w-[min(270px,100%)] flex-[3_1_420px]`}>
            <LogoStack logos={c.automations.logos} />
            <h2 className={TITLE}>{c.automations.title}</h2>
            <p className={`${BODY} max-w-[340px]`}>{c.automations.body}</p>
            <span className={CTA}>
              {c.automations.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
            <FlowPeek />
          </a>

          <a href="#build-plan" onClick={openView} data-case={c.plan.cue} className={`${CARD} min-w-[min(250px,100%)] flex-[2_1_300px]`}>
            <LogoStack logos={c.plan.logos} />
            <h2 className={TITLE}>{c.plan.title}</h2>
            <p className={BODY}>{c.plan.body}</p>
            <div className="mt-auto flex flex-col gap-3 rounded-[14px] border border-b1 bg-s0 p-4">
              <span className="font-mono text-[9.5px] tracking-[.14em] text-ink3">{c.plan.kicker}</span>
              <span className="text-[15px] font-semibold tracking-[-.02em]">{c.plan.heading}</span>
              <div className="flex flex-wrap gap-1.5">
                {c.plan.steps.map((s, i) => (
                  <span
                    key={s.label}
                    className={`flex items-center gap-1.5 rounded-lg border py-[5px] pr-2.5 pl-[5px] text-[11.5px] font-medium ${i === c.plan.steps.length - 1 ? 'border-accent bg-accent text-on-accent' : 'border-b1 bg-s1 text-ink2'}`}
                  >
                    <span aria-hidden className="grid size-[18px] place-items-center rounded-[5px] bg-logo-chip">
                      <BrandIcon slug={s.logo} size={12} className="block" />
                    </span>
                    {s.label}
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
                className="group/card flex flex-1 items-start gap-3 rounded-[18px] border border-b1 bg-linear-to-b from-s1 to-s2 p-4 text-left text-ink transition-[translate,border-color,box-shadow] duration-350 hover:-translate-y-0.5 hover:border-b2 hover:from-s2 hover:to-hover hover:shadow-[0_22px_50px_-32px_var(--washB)]"
              >
                <LogoStack logos={w.logos} size="sm" />
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
          <SitesCard onOpen={openView} />

          <a href="#ai-agents" onClick={openView} data-case={c.agents.cue} className={`${CARD} min-w-[min(270px,100%)] flex-[3_1_380px]`}>
            <LogoStack logos={c.agents.logos} />
            <h2 className={TITLE}>{c.agents.title}</h2>
            <p className={`${BODY} max-w-[420px]`}>{c.agents.body}</p>
            <AgentsPreview />
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3.5">
              {c.agents.counts.map((a) => (
                <span key={a.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-3 py-2 text-[12.5px] text-ink2">
                  <BrandIcon slug={a.logo} size={14} className="block" />
                  {a.name}
                </span>
              ))}
              <span className="ml-1 flex flex-wrap items-center gap-2">
                {c.agents.tools.map((l) => (
                  <BrandIcon key={l.slug} slug={l.slug} size={16} className="block" />
                ))}
              </span>
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
