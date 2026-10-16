import { UserCircleIcon } from '@phosphor-icons/react/ssr'
import LoopVideo from '@/components/ui/LoopVideo'
import { home } from '@/data/home'
import HomeCard from './HomeCard'

export default function AboutCard() {
  const c = home.cards.about
  return (
    <HomeCard title={c.title} icon={UserCircleIcon} href={c.href} className="min-w-[min(220px,100%)] flex-[1_1_240px] gap-3 p-5">
      <p className="text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="mt-auto overflow-hidden rounded-[14px] border border-b1 bg-frame">
        <LoopVideo {...c.image} />
      </div>
    </HomeCard>
  )
}
