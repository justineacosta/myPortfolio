'use client'

import { usePalette } from './CommandPalette'
import TopBar from './TopBar'

export default function ShellTopBar() {
  const { openPalette } = usePalette()
  return <TopBar onJump={openPalette} />
}
