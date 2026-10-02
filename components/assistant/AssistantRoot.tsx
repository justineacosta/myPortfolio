'use client'

import { useRef } from 'react'
import { AssistantProvider } from './AssistantProvider'
import AssistantLauncher from './AssistantLauncher'
import AssistantPanel from './AssistantPanel'

/** The assistant on the page: its conversation state, the launcher and the panel. `mode` is which engine answers first (see `mode()` in lib/assistant/config.ts). Mount it inside the shell's NavigationProvider. */
export default function AssistantRoot({ mode }: { mode: 'ai' | 'quick' }) {
  const launcher = useRef<HTMLButtonElement>(null)
  return (
    <AssistantProvider>
      <AssistantLauncher ref={launcher} />
      <AssistantPanel launcherRef={launcher} mode={mode} />
    </AssistantProvider>
  )
}
