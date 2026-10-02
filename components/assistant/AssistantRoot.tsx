'use client'

import { useRef } from 'react'
import { AssistantProvider } from './AssistantProvider'
import AssistantLauncher from './AssistantLauncher'
import AssistantPanel from './AssistantPanel'

/** The assistant on the page: its conversation state, the launcher and the panel. Mount it inside the shell's NavigationProvider. */
export default function AssistantRoot() {
  const launcher = useRef<HTMLButtonElement>(null)
  return (
    <AssistantProvider>
      <AssistantLauncher ref={launcher} />
      <AssistantPanel launcherRef={launcher} />
    </AssistantProvider>
  )
}
