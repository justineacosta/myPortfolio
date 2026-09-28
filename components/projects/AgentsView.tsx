import { agentsView as a } from '@/data/projectDocs'
import { projects } from '@/data/projects'
import Window, { WindowHero, WindowSection } from './Window'

/** Every AI system, grouped, with its live or internal status (Kraft Projects Board.dc.html:132-188; GROUPS at :336-373). */
export default function AgentsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Window open={open} onClose={onClose} title={a.title}>
      <WindowHero kicker={a.kicker} lede={a.lede} stack={a.builtWith} />
      {a.groups.map((g) => (
        <WindowSection key={g.name} name={g.name} blurb={g.blurb}>
          {g.cards.map((c) => (
            <article key={c.title} className="flex min-w-[240px] flex-[0_1_280px] flex-col gap-[9px] rounded-2xl border border-b1 bg-linear-to-b from-s1 to-s2 p-4">
              <div className="flex items-center gap-2">
                {c.icons.map((Tool, i) => (
                  <span key={`${c.title}-${i}`} aria-hidden className="grid size-[34px] place-items-center rounded-[10px] border border-b1 bg-chip">
                    <Tool size={17} className="text-accent" />
                  </span>
                ))}
                <span
                  className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-[5px] font-mono text-[9.5px] tracking-[.1em] ${c.live ? 'bg-wash text-accent' : 'bg-chip text-ink3'}`}
                >
                  <span aria-hidden className={`size-1.5 rounded-full ${c.live ? 'bg-accent' : 'bg-ink3'}`} />
                  {c.live ? projects.live : projects.internal}
                </span>
              </div>
              <h4 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-.02em]">
                <c.icon size={16} aria-hidden className="text-accent" />
                {c.title}
              </h4>
              <p className="text-[13px] leading-normal text-ink2">{c.desc}</p>
              <span className="text-xs leading-[1.45] text-ink3">{c.meta}</span>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full border border-b1 bg-chip px-[9px] py-1 text-[11.5px] text-ink2">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </WindowSection>
      ))}
    </Window>
  )
}
