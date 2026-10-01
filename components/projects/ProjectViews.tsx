'use client'

import { useHashView } from '@/hooks/useHashView'
import { PROJECT_VIEWS } from '@/data/projects'
import AgenticFrameworkView from './AgenticFrameworkView'
import AgentsView from './AgentsView'
import AutomationsView from './AutomationsView'
import EndToEndView from './EndToEndView'
import PlanView from './PlanView'
import SitesView from './SitesView'

/**
 * Every sub-view of the board, mounted closed so its content is in the
 * pre-rendered HTML. The URL hash picks the open one (/projects#build-plan).
 */
export default function ProjectViews() {
  const { view, close } = useHashView(PROJECT_VIEWS)
  return (
    <>
      <AgenticFrameworkView open={view === 'agentic-framework'} onClose={close} />
      <EndToEndView open={view === 'end-to-end'} onClose={close} />
      <PlanView open={view === 'build-plan'} onClose={close} />
      <AgentsView open={view === 'ai-agents'} onClose={close} />
      <AutomationsView open={view === 'automations'} onClose={close} />
      <SitesView open={view === 'sites'} onClose={close} />
    </>
  )
}
