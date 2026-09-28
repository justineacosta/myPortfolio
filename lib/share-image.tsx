import { ImageResponse } from 'next/og'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { readTokens } from './tokens'

export const SHARE_SIZE = { width: 1200, height: 630 }
export const SHARE_ALT = `${profile.name} · Kraft: ${home.headline.join(' ')}`

/** The share image (spec §13): Home's headline on Kraft's dark palette, lit by the ambient green like the page frames. */
export function shareImage() {
  const t = readTokens('dark')
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: t.ink,
          backgroundColor: t.bg,
          backgroundImage: `radial-gradient(900px 520px at 78% -10%, rgba(${t.amb},.55), rgba(${t.amb},0) 60%)`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: t.accent }}>{`${profile.brand} · ${profile.name.toUpperCase()}`}</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>
          <span>{home.headline[0]}</span>
          <span style={{ color: t.accent }}>{home.headline[1]}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: t.ink2, maxWidth: 900 }}>{home.lede}</div>
      </div>
    ),
    SHARE_SIZE,
  )
}
