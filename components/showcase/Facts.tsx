import { FACTS, showcase } from '@/data/showcase'

/** What's in the four builds, counted from the data (data/showcase.ts FACTS). It does not move. */
export default function Facts() {
  return (
    <section aria-labelledby="facts-title" className="flex flex-col gap-4">
      <h2 id="facts-title" className="font-mono text-[10px] tracking-[.16em] text-accent uppercase">
        {showcase.facts.title}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,128px),1fr))] gap-3">
        {FACTS.map((f) => (
          <li key={f.label} className="flex flex-col gap-1.5 rounded-[16px] border border-b1 bg-linear-to-b from-s2 to-s1 px-5 py-4">
            <span className="text-[clamp(28px,3.4cqw,44px)] leading-none font-bold tracking-[-.03em] tabular-nums">{f.n}</span>
            <span className="text-[13px] text-ink2">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
