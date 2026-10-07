import Image from 'next/image'
import { BADGE, CARD, TAG } from '@/components/ui/styles'
import { SERVICES, servicesPage } from '@/data/services'
import { brandIcon } from '@/data/stack'

/**
 * "What I can do for you" (KraftScreens.dc.html:243-274): the six offers.
 * From the sidebar breakpoint they sit three over three; below it they wrap,
 * two a row on tablets and one on phones.
 */
export default function Offers() {
  const o = servicesPage.offers
  const total = String(SERVICES.length).padStart(2, '0')
  return (
    <section id={o.id} aria-labelledby="offers-title" className="flex scroll-mt-[88px] shell:scroll-mt-6 flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <div className="flex flex-wrap items-baseline gap-3 pt-1.5">
        <h2 id="offers-title" className="text-[clamp(18px,2.2cqw,26px)] font-semibold tracking-[-.025em]">
          {o.title}
        </h2>
        <span className="text-[13px] text-ink3">{o.aside}</span>
      </div>
      <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] shell:grid shell:grid-cols-3">
        {SERVICES.map((s) => (
          <article
            key={s.n}
            className={`${CARD} flex min-w-[min(245px,100%)] flex-[1_1_300px] flex-col gap-3 p-5 transition-[translate,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:shadow-[0_24px_60px_-30px_var(--washB)]`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex gap-[5px] rounded-[13px] border border-b1 bg-chip p-[5px]">
                {s.logos.map((l, li) => (
                  <span key={`${l.slug}-${li}`} className="grid size-[30px] place-items-center rounded-[9px] bg-logo-chip shadow-(--chip-shadow)">
                    <Image src={brandIcon(l.slug)} alt={l.name} width={17} height={17} className="block size-[17px] object-contain" />
                  </span>
                ))}
              </div>
              <span className="ml-auto font-mono text-[9.5px] tracking-[.1em] text-ink3">
                {s.n} / {total}
              </span>
            </div>
            <h3 className="text-[17.5px] font-semibold tracking-[-.02em]">{s.name}</h3>
            <p className="text-[13px] leading-normal text-ink3">{s.line}</p>
            <span className={`self-start ${BADGE}`}>{s.badge}</span>
            <ul className="mt-0.5 flex flex-col gap-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-[9px]">
                  <span aria-hidden className="mt-[5px] size-[5px] shrink-0 rounded-full bg-accent opacity-70" />
                  <span className="text-[12.5px] leading-[1.45] text-ink2">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-1.5 border-t border-b1 pt-1.5">
              {s.tags.map((t) => (
                <span key={t} className={`mt-1 ${TAG}`}>
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
