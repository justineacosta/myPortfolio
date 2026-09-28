import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FolderOpenIcon, ImageIcon } from '@phosphor-icons/react/ssr'
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
    <HomeCard title={c.title} icon={FolderOpenIcon} meta={c.meta} href={c.href} className="min-w-[min(250px,100%)] flex-[2_1_400px] gap-[13px] p-5">
      <p className="max-w-[420px] text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="arc relative h-[215px] w-full max-w-[369px] self-center">
        {c.arc.map((shot, i) => {
          const a = ARC[i]
          const pose = { '--x': a.x, '--y': a.y, '--r': a.r, '--z': 10 + (5 - Math.abs(i - 2)) } as CSSProperties
          return (
            <div key={shot.label} className="arc-card" style={pose}>
              {isPlaceholder(shot.src) ? (
                // Kraft's empty image-slot: a dashed frame, an image glyph and the slot's size.
                <span className="m-1.5 grid h-[calc(100%-12px)] place-content-center justify-items-center gap-1.5 rounded-[9px] border border-dashed border-b2 text-ink3">
                  <ImageIcon size={20} aria-hidden />
                  <span className="text-[11px] font-medium whitespace-nowrap">{shot.label}</span>
                </span>
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
