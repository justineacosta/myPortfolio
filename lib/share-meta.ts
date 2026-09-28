import { home } from '@/data/home'
import { profile } from '@/data/profile'

/** The share image's size and alt text (spec §13), kept apart from next/og so page metadata can name them. */
export const SHARE_SIZE = { width: 1200, height: 630 }
export const SHARE_ALT = `${profile.name} · Kraft: ${home.headline.join(' ')}`
