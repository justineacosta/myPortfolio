import { QuotesIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { CLIENTS } from '@/data/testimonials'
import HomeCard from './HomeCard'

export default function TestimonialsCard() {
  const c = home.cards.testimonials
  return (
    <HomeCard title={c.title} icon={QuotesIcon} meta={c.meta} href={c.href} className="min-w-[250px] flex-[2_1_380px] gap-[13px] p-5">
      <ul className="flex flex-col gap-[9px]">
        {CLIENTS.map((cl) => (
          <li key={cl.n} className="flex items-center gap-3 rounded-[13px] border border-b1 bg-s0 px-3.5 py-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[9px] border border-b1 bg-s3 font-mono text-[9.5px] text-ink3">
              {cl.n}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[13px] font-semibold text-ink-soft">{cl.name}</span>
              <span className="truncate font-mono text-[9.5px] tracking-[.05em] text-ink3">{cl.role}</span>
            </div>
            <span className="ml-auto max-w-[40%] truncate text-[11.5px] text-accent opacity-85">{cl.tag}</span>
          </li>
        ))}
      </ul>
    </HomeCard>
  )
}
