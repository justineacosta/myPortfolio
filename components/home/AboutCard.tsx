import { UserCircleIcon } from '@phosphor-icons/react/ssr'
import LoopVideo from '@/components/ui/LoopVideo'
import { home } from '@/data/home'
import HomeCard from './HomeCard'

export default function AboutCard() {
  const c = home.cards.about
  return (
    <HomeCard title={c.title} icon={UserCircleIcon} href={c.href} className="min-w-[min(220px,100%)] flex-[1_1_240px] gap-3 p-5">
      {/* 16:9 at least, then it grows into the card's spare height; the art crops at the sides rather than squash. */}
      <div className="relative aspect-video flex-1 overflow-hidden rounded-[14px] border border-b1 bg-frame">
        <LoopVideo {...c.image} className="absolute inset-0 block size-full object-cover" />
      </div>
    </HomeCard>
  )
}
