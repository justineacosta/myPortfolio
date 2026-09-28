import Image from 'next/image'
import { UserCircleIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import HomeCard from './HomeCard'

export default function AboutCard() {
  const c = home.cards.about
  return (
    <HomeCard title={c.title} icon={UserCircleIcon} href={c.href} className="min-w-[min(220px,100%)] flex-[1_1_240px] gap-3 p-5">
      <p className="text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="mt-auto overflow-hidden rounded-[14px] border border-b1 bg-frame">
        <Image
          src={c.image.src}
          alt={c.image.alt}
          width={c.image.width}
          height={c.image.height}
          unoptimized
          className="block h-auto w-full"
        />
      </div>
    </HomeCard>
  )
}
