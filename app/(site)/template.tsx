import type { ReactNode } from 'react'

/** Remounts on every navigation, so Kraft's 540ms rise-in (kScreenA) replays. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-screen-in">{children}</div>
}
