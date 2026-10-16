import { StackSimpleIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { EXPERIMENTAL, stackRows } from '@/data/stack'
import HomeCard from './HomeCard'
import BrandIcon from '@/components/ui/BrandIcon'

/** Two opposing marquees of tool chips; the dot says in use (accent) or experimental (grey). KraftScreens.dc.html:99-126. */
export default function StackCard() {
  const c = home.cards.stack
  return (
    <HomeCard
      title={c.title}
      icon={StackSimpleIcon}
      className="min-w-[min(220px,100%)] flex-[1_1_240px] gap-[13px] overflow-hidden pt-5 pb-[22px]"
      headClassName="px-5"
    >
      <p className="px-5 text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div data-marquee className="edge-fade my-auto flex flex-col gap-[9px] [--fade:9%]">
        {stackRows().map((row, ri) => (
          <ul key={ri} className={`flex w-max animate-marquee gap-2 ${ri === 1 ? 'marquee-reverse' : ''}`}>
            {[0, 1].map((copy) =>
              row.map((t) => {
                const exp = EXPERIMENTAL.includes(t.name)
                return (
                  <li
                    key={`${copy}-${t.slug}`}
                    aria-hidden={copy === 1 || undefined}
                    data-experimental={exp || undefined}
                    className="flex items-center gap-2 rounded-full border border-b1 bg-chip px-3 py-[7px] whitespace-nowrap"
                  >
                    <BrandIcon slug={t.slug} size={14} className="block shrink-0" />
                    <span className="text-xs font-medium text-ink2">{t.name}</span>
                    <span
                      aria-hidden
                      className={`size-1.5 shrink-0 rounded-full ${exp ? 'bg-ink3 shadow-[0_0_8px_var(--ink3)]' : 'bg-accent shadow-[0_0_8px_var(--accent)]'}`}
                    />
                  </li>
                )
              }),
            )}
          </ul>
        ))}
      </div>
      <div className="flex items-center gap-3.5 px-5 font-mono text-[9.5px] tracking-[.12em] text-ink3">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {c.inUse}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-ink3" />
          {c.experimental}
        </span>
      </div>
    </HomeCard>
  )
}
