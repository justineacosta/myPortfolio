import Image from 'next/image'
import IntentLink from '@/components/ui/IntentLink'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { isHidden } from '@/data/nav'
import { projects } from '@/data/projects'
import { BODY, CTA, TITLE } from './styles'
import Window from './Window'
import BrandIcon from '@/components/ui/BrandIcon'

const HEADING = 'text-[15px] font-semibold tracking-[-.02em]'
const PROSE = 'text-[14px] leading-[1.55] text-ink2'

/**
 * The Barangay San Fernando case study (spec 2026-10-13-san-fernando-case-study):
 * the real client build, read in the document window. Rendered from
 * data/projects.ts, so its text is in the pre-rendered page. The way to
 * start a project leaves with the Contact page when that is switched off.
 */
export default function CaseStudyView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.caseStudy
  return (
    <Window open={open} onClose={onClose} title={s.title}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Image src={s.seal.src} alt={s.seal.alt} width={64} height={64} className="size-16 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[.14em] text-accent">{s.kicker}</span>
          <h2 className={TITLE}>{s.title}</h2>
          <p className={BODY}>{s.tagline}</p>
        </div>
      </header>

      <ul className="flex flex-wrap gap-2" aria-label="Stack">
        {s.stack.map((b) => (
          <li key={b.slug} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-3 py-2 text-[12.5px] text-ink2">
            <BrandIcon slug={b.slug} size={14} className="block" />
            {b.name}
          </li>
        ))}
      </ul>

      <section className="flex max-w-[68ch] flex-col gap-2">
        <h3 className={HEADING}>{s.problemLabel}</h3>
        <p className={PROSE}>{s.problem}</p>
      </section>

      <section className="flex max-w-[68ch] flex-col gap-2">
        <h3 className={HEADING}>{s.solutionLabel}</h3>
        <p className={PROSE}>{s.solution}</p>
      </section>

      <section className="flex max-w-[68ch] flex-col gap-2">
        <h3 className={HEADING}>{s.featuresLabel}</h3>
        <ul className={`${PROSE} flex list-disc flex-col gap-1.5 pl-5 marker:text-accent`}>
          {s.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {!isHidden(s.contact.href) && (
        <IntentLink href={s.contact.href} className={`${CTA} self-start text-[11px]`}>
          {s.contact.label} <ArrowRightIcon size={13} aria-hidden />
        </IntentLink>
      )}
    </Window>
  )
}
