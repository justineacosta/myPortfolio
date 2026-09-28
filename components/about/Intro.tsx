import { CARD } from '@/components/ui/styles'
import { about } from '@/data/about'

/** "I care about the parts nobody demos." (KraftScreens.dc.html:403-407) */
export default function Intro() {
  const i = about.intro
  return (
    <div className={`${CARD} flex flex-col gap-3.5 p-[clamp(16px,1.8cqw,24px)]`}>
      <h2 className="text-[clamp(18px,2.4cqw,28px)] leading-[1.25] font-bold tracking-[-.03em]">
        {i.heading} <span className="text-ink3">{i.aside}</span>
      </h2>
      <p className="text-[13.5px] leading-[1.6] text-ink2">
        <strong className="font-semibold text-ink">{i.lead}</strong>
        {i.body}
      </p>
      <p className="text-[13.5px] leading-[1.6] text-ink3">{i.story}</p>
    </div>
  )
}
