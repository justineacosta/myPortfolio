import type { Doc } from '@/data/projects'
import Window, { WindowHero, WindowSection } from './Window'

/** One write-up (Kraft Projects Board.dc.html:190-238; DOCS at :375-509). */
export default function DocView({ doc, open, onClose }: { doc: Doc; open: boolean; onClose: () => void }) {
  return (
    <Window open={open} onClose={onClose} title={doc.title}>
      <WindowHero kicker={doc.kicker} lede={doc.lede} stack={doc.stack} />
      {doc.sections.map((s) => (
        <WindowSection key={s.name} name={s.name} blurb={s.blurb}>
          {s.cards.map((c) => (
            <article key={c.title} className="flex min-w-[240px] flex-[1_1_280px] flex-col gap-[9px] rounded-2xl border border-b1 bg-linear-to-b from-s1 to-s2 p-4">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="grid size-[34px] place-items-center rounded-[10px] border border-b1 bg-chip">
                  <c.icon size={17} className="text-accent" />
                </span>
                <span className="ml-auto font-mono text-[9.5px] tracking-[.14em] text-ink3">{c.step}</span>
              </div>
              <h4 className="text-[15px] font-semibold tracking-[-.02em]">{c.title}</h4>
              <p className="text-[13px] leading-normal text-ink2">{c.desc}</p>
              <span className="mt-auto pt-1.5 font-mono text-[11px] leading-[1.45] text-ink3">{c.meta}</span>
            </article>
          ))}
        </WindowSection>
      ))}
    </Window>
  )
}
