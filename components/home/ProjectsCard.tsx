import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FolderOpenIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { isPlaceholder } from '@/lib/placeholder'
import HomeCard from './HomeCard'

/** Kraft's arc geometry (KraftScreens.dc.html:595-601), in % and degrees. */
const ARC = [
  { r: -15, x: -21, y: 5 },
  { r: -7.5, x: -10.5, y: 1.8 },
  { r: 0, x: 0, y: 0 },
  { r: 7.5, x: 10.5, y: 1.8 },
  { r: 15, x: 21, y: 5 },
]

export default function ProjectsCard() {
  const c = home.cards.projects
  return (
    <HomeCard title={c.title} icon={FolderOpenIcon} meta={c.meta} href={c.href} className="min-w-[250px] flex-[2_1_400px] gap-[13px] p-5">
      <p className="max-w-[420px] text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="arc relative h-[215px] w-full max-w-[369px] self-center">
        {c.arc.map((shot, i) => {
          const a = ARC[i]
          const pose = { '--x': a.x, '--y': a.y, '--r': a.r, '--z': 10 + (5 - Math.abs(i - 2)) } as CSSProperties
          return (
            <div key={shot.label} className="arc-card" style={pose}>
              {isPlaceholder(shot.src) ? (
                <span className="grid h-full place-items-center font-mono text-[9px] tracking-[.06em] text-ink4">{shot.label}</span>
              ) : (
                <Image src={shot.src} alt="" fill sizes="150px" className="object-cover" />
              )}
            </div>
          )
        })}
      </div>
    </HomeCard>
  )
}
