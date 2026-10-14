import type { MouseEvent } from 'react'
import Image from 'next/image'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'
import LogoStack from './LogoStack'
import { BODY, CARD, CTA, TITLE } from './styles'

type Props = { onOpen: (e: MouseEvent<HTMLAnchorElement>) => void }

/**
 * The real client banner that leads the board (spec 2026-10-13-san-fernando-case-study):
 * a link to the San Fernando case study, set apart from the samples by its
 * REAL CLIENT kicker. The seal is decorative here (the view names it), so the
 * link's name starts with the kicker. Three of the stack's logos, like every card.
 */
export default function CaseStudyCard({ onOpen }: Props) {
  const s = projects.caseStudy
  return (
    <a href={`#${s.view}`} onClick={onOpen} data-case={s.cue} className={`${CARD} w-full gap-4 sm:flex-row sm:items-center sm:gap-5`}>
      <Image src={s.seal.src} alt="" width={64} height={64} className="size-14 shrink-0 rounded-full sm:size-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-mono text-[10px] tracking-[.14em] text-accent">{s.kicker}</span>
        <h2 className={TITLE}>{s.cardTitle}</h2>
        <p className={`${BODY} max-w-130`}>{s.body}</p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
        <LogoStack logos={s.stack.slice(0, 3)} />
        <span className={CTA}>
          {s.cue} <ArrowUpRightIcon size={13} aria-hidden />
        </span>
      </div>
    </a>
  )
}
