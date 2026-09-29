'use client'

import type { CSSProperties, MouseEvent } from 'react'
import Image from 'next/image'
import { FolderOpenIcon } from '@phosphor-icons/react/ssr'
import { useShellNav } from '@/components/shell/NavigationProvider'
import Shot from '@/components/ui/Shot'
import { home } from '@/data/home'
import { BUILDS } from '@/data/projects'
import { useFan } from '@/hooks/useFan'
import { FRONT, nearestOf, type Pose } from '@/lib/fan'
import HomeCard from './HomeCard'

/** Kraft's arc geometry (KraftScreens.dc.html:595-601): offsets in % of a tile, tilt in degrees. */
const ARC: Pose[] = [
  { r: -15, x: -21, y: 5 },
  { r: -7.5, x: -10.5, y: 1.8 },
  { r: 0, x: 0, y: 0 },
  { r: 7.5, x: 10.5, y: 1.8 },
  { r: 15, x: 21, y: 5 },
]
/** Just off each end of the arc, where a build leaves and waits to come in. */
const OFF: Record<'left' | 'right', Pose> = { left: { r: -22, x: -30, y: 9 }, right: { r: 22, x: 30, y: 9 } }
/** A tile's width as a share of the arc's (.arc-card), and how far the arc opens out on hover (Kraft's 1.9x). */
const TILE_SHARE = 0.4
const SPREAD_X = 1.9

/**
 * Home's Projects card: a link to Projects whose fan holds one tile per build
 * there (BUILDS). It turns, scrubs, tilts and peeks like the Funnels card
 * (hooks/useFan.ts). A click on the fan opens the build in front on Projects;
 * anywhere else on the card, a modified click, or Enter opens the Projects
 * page. The fan is a picture; the link's name is the card's text.
 */
export default function ProjectsCard() {
  const c = home.cards.projects
  const { go } = useShellNav()
  const { fan, stage, held, peek, front, named, frontItem, slotOf, handlers } = useFan({
    count: BUILDS.length,
    pick: (dx, width) =>
      nearestOf(
        dx,
        ARC.map((a) => (a.x / 100) * TILE_SHARE * width * SPREAD_X),
      ),
  })
  const tag = named === undefined ? undefined : BUILDS[named]

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    handlers.onClick(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const build = frontItem === undefined ? undefined : BUILDS[frontItem]
    if (!build) return
    e.preventDefault()
    e.stopPropagation()
    go(`/projects#${build.view}`)
  }

  return (
    <HomeCard title={c.title} icon={FolderOpenIcon} href={c.href} className="min-w-[min(250px,100%)] flex-[2_1_400px] gap-[13px] p-5">
      <p className="max-w-[420px] text-[13.5px] leading-normal text-ink3">{c.body}</p>
      {/* Kraft's 369x215 fan on phones. From 640px it fills the card, keeping that shape, up to about 1.4x (520x303). */}
      <div
        ref={fan}
        aria-hidden
        {...handlers}
        onClick={onClick}
        className="arc relative h-[215px] w-full max-w-[369px] touch-pan-y self-center sm:aspect-[369/215] sm:h-auto sm:max-w-[520px]"
      >
        <span data-fan-tag data-on={tag ? '' : undefined} className="fan-tag">
          <span className="size-1.5 rounded-full bg-accent" />
          {tag?.name}
        </span>
        <div ref={stage} data-spread={held || undefined} className="arc-stage">
          {BUILDS.map((build, i) => {
            const slot = slotOf(i)
            const onArc = typeof slot === 'number'
            const pose = onArc ? ARC[slot] : OFF[slot]
            const isFront = slot === front
            const style = {
              '--x': pose.x,
              '--y': pose.y,
              '--r': pose.r,
              '--d': onArc ? 2 - Math.abs(slot - FRONT) : 0,
              zIndex: isFront ? 20 : onArc ? 10 - Math.abs(slot - front) : 0,
            } as CSSProperties
            return (
              <div
                key={build.view}
                data-fan-tile
                data-site={build.name}
                data-front={isFront || undefined}
                data-off={!onArc || undefined}
                data-peek={(isFront && peek && !!build.tall) || undefined}
                style={style}
                className="arc-card"
              >
                {build.tall ? (
                  <Image src={build.tall} alt="" width={432} height={1540} sizes="(min-width: 640px) 210px, 150px" draggable={false} className="fan-page" />
                ) : (
                  <Shot src={build.shot} hint={build.name} sizes="(min-width: 640px) 210px, 150px" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </HomeCard>
  )
}
