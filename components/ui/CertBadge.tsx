import { useId } from 'react'
import Image from 'next/image'

/** badge.svg's medallion (r=32 around 48,40 in a 96 box) is `size` across. */
const RING_R = 32

/**
 * A certification medal in the shape of kapeportfolio's badge.svg
 * (reference/kapeportfolio/public/placeholders/badge.svg): a medallion with a
 * dashed inner ring and a ribbon (widened from 28/44 to 36/56), coloured from
 * Kraft's tokens, with the logo where the placeholder's "YOUR BADGE" text was.
 * The box is the medallion; the ribbon hangs below it without taking layout
 * room, and turns back by the caller's --cert-tilt so it always hangs straight
 * down. Purely a picture: the caller names it.
 */
export default function CertBadge({ icon, size }: { icon: string; size: number }) {
  const ribbon = `cert-ribbon-${useId()}`
  const s = size / (RING_R * 2)
  // Small enough that a square logo's corners clear the dashed ring (r=23 of 32).
  const logo = Math.round(size * 0.44)
  return (
    <span aria-hidden data-cert-badge className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 96 96"
        width={96 * s}
        height={96 * s}
        className="cert-art absolute max-w-none overflow-visible"
        style={{ left: -16 * s, top: -8 * s }}
      >
        <defs>
          <linearGradient id={ribbon} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="1" style={{ stopColor: 'rgb(var(--amb))' }} />
          </linearGradient>
        </defs>
        <path data-cert-ribbon className="cert-ribbon" d="M30 60 20 90l28-10 28 10-10-30z" fill={`url(#${ribbon})`} />
        <circle className="cert-halo" cx="48" cy="40" r={RING_R} />
        <circle data-cert-ring cx="48" cy="40" r={RING_R} strokeWidth="3" style={{ fill: 'var(--logo-chip)', stroke: 'var(--cert-ink)' }} />
        <circle
          data-cert-dashes
          className="cert-dashes"
          cx="48"
          cy="40"
          r="23"
          fill="none"
          strokeWidth="2"
          strokeDasharray="4 4"
          style={{ stroke: 'var(--cert-ink)' }}
        />
      </svg>
      <Image src={icon} alt="" width={logo} height={logo} className="relative block object-contain" style={{ width: logo, height: logo }} />
    </span>
  )
}
