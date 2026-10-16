'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type Props = { webm: string; mp4: string; still: string; alt: string; width: number; height: number; className?: string }

/**
 * A short animation as a muted, looping, inline video: a fraction of the size
 * of the GIF it replaces (spec §11 still applies). WebM first, MP4 for Safari,
 * the still frame as the poster. It never autoplays: it starts from an effect,
 * once the page knows motion is allowed, so a reduced-motion visitor never
 * sees a frame of movement. With motion off (the OS setting or the access
 * menu's switch) it is the still frame alone.
 */
export default function LoopVideo({ webm, mp4, still, alt, width, height, className = 'block h-auto w-full' }: Props) {
  const off = useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (off) return
    // A browser may refuse to play (data saver, a power-saving mode); the poster stays, which is fine.
    video.current?.play()?.catch(() => {})
  }, [off])

  if (off) {
    // eslint-disable-next-line @next/next/no-img-element -- a single pre-sized still, nothing for the optimiser to do
    return <img src={still} alt={alt} width={width} height={height} className={className} />
  }
  return (
    <video ref={video} role="img" aria-label={alt} width={width} height={height} poster={still} muted loop playsInline preload="auto" className={className}>
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  )
}
