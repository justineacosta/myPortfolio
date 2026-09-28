import { home } from '@/data/home'
import { isPlaceholder } from '@/lib/placeholder'

/** Three proof facts under the actions (spec §8). A placeholder shows its short stand-in. */
export default function Stats() {
  return (
    <ul data-intro-hold data-intro-delay="140" className="mt-[22px] flex max-w-[560px] flex-wrap gap-2.5">
      {home.stats.map((s) => {
        const gap = isPlaceholder(s.value)
        return (
          <li
            key={s.label}
            title={gap ? s.value : undefined}
            className="flex min-w-[104px] flex-1 flex-col gap-1.5 rounded-[16px] border border-b1 bg-s1 px-4 py-3"
          >
            <span className="text-[22px] leading-none font-semibold tracking-[-.02em]">
              {gap ? s.short : s.value}
              {s.unit && <span className="ml-1 text-[13px] font-medium text-ink3">{s.unit}</span>}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.14em] text-ink3 uppercase">{s.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
