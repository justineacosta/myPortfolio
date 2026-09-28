import { navForPath } from '@/data/nav'

/** Phase 1 stand-in for a page; each phase replaces its own routes. */
export default function PagePlaceholder({ href, phase }: { href: string; phase: number }) {
  const item = navForPath(href)
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)] pt-2">
      <p className="font-mono text-[10.5px] tracking-[.14em] text-accent">{item.eyebrow}</p>
      <h1 className="text-[clamp(28px,4.6cqw,54px)] leading-[1.03] font-bold tracking-[-.035em]">{item.label}</h1>
      <p data-reveal className="max-w-[60ch] text-ink2">{`PLACEHOLDER - this page is built in Phase ${phase}.`}</p>
    </section>
  )
}
