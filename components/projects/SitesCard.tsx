'use client'

import type { CSSProperties, MouseEvent } from 'react'
import Image from 'next/image'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'
import { useFan } from '@/hooks/useFan'
import { FRONT, nearestSlot, OFF, POSES, SPREAD } from '@/lib/fan'
import LogoStack from './LogoStack'
import { BODY, CARD, CTA, TITLE } from './styles'

type Props = { onOpen: (e: MouseEvent<HTMLAnchorElement>) => void }

/**
 * The Funnels and sites card: a link to the sites view whose fan of sample
 * sites turns, scrubs, tilts and peeks (hooks/useFan.ts). A tile's page is a
 * tall screenshot, so a peek scrolls down the real site. The fan is a
 * picture; the link's name is the card's text.
 */
export default function SitesCard({ onOpen }: Props) {
  const c = projects.cards.sites
  const sites = projects.sitesView.sites
  const { fan, stage, held, peek, front, named: n, slotOf, handlers } = useFan({
    count: sites.length,
    pick: (dx) => nearestSlot(dx, SPREAD),
  })
  const named = n === undefined ? undefined : sites[n]

  return (
    <a href="#sites" onClick={onOpen} data-case={c.cue} className={`${CARD} min-w-[min(260px,100%)] flex-[2_1_320px]`}>
      <LogoStack logos={c.logos} />
      <h2 className={TITLE}>{c.title}</h2>
      <p className={BODY}>{c.body}</p>
      <span className={CTA}>
        {c.cta} <ArrowsClockwiseIcon size={13} aria-hidden />
      </span>
      <div
        ref={fan}
        data-fan
        aria-hidden
        {...handlers}
        className="site-fan relative mt-2.5 h-[clamp(150px,16cqw,200px)] touch-pan-y overflow-hidden"
      >
        <span data-fan-tag data-on={named ? '' : undefined} className="fan-tag">
          <span className="size-1.5 rounded-full bg-accent" />
          {named?.name}
        </span>
        <div ref={stage} data-spread={held || undefined} style={{ '--spread': held ? SPREAD : 1 } as CSSProperties} className="fan-stage">
          {sites.map((site, i) => {
            const slot = slotOf(i)
            const onArc = typeof slot === 'number'
            const pose = onArc ? POSES[slot] : OFF[slot]
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
                key={site.file}
                data-fan-tile
                data-site={site.name}
                data-front={isFront || undefined}
                data-off={!onArc || undefined}
                data-peek={(isFront && peek) || undefined}
                style={style}
                className="fan-tile"
              >
                <Image src={site.tall} alt="" width={432} height={1540} sizes="130px" draggable={false} className="fan-page" />
              </div>
            )
          })}
        </div>
      </div>
    </a>
  )
}
