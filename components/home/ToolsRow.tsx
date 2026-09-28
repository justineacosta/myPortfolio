import Image from 'next/image'
import { home } from '@/data/home'
import { brandIcon, TOOLS } from '@/data/stack'

/** "Daily drivers" and the tools marquee (KraftScreens.dc.html:62-74). The second copy only closes the loop. */
export default function ToolsRow() {
  return (
    <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]">
      <div className="flex min-w-[min(170px,100%)] flex-[1_1_190px] flex-col justify-center gap-[5px] rounded-[18px] border border-b1 bg-s1 px-[18px] py-[15px]">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">{home.tools.kicker}</span>
        <span className="text-[15.5px] font-semibold tracking-[-.015em]">{home.tools.title}</span>
      </div>
      <div
        data-marquee
        className="edge-fade flex min-h-[62px] min-w-[min(200px,100%)] flex-[3_1_380px] items-center overflow-hidden rounded-[18px] border border-b1 bg-s1"
      >
        <ul className="flex w-max animate-marquee gap-[26px] px-[18px]">
          {[0, 1].map((copy) =>
            TOOLS.map((t) => (
              <li
                key={`${copy}-${t.slug}`}
                aria-hidden={copy === 1 || undefined}
                className="flex items-center gap-2 text-[13.5px] font-medium whitespace-nowrap text-ink2"
              >
                <Image src={brandIcon(t.slug)} alt="" width={18} height={18} className="block shrink-0" />
                {t.name}
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  )
}
