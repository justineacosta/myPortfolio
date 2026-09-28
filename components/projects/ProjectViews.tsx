'use client'

import { useHashView } from '@/hooks/useHashView'
import { DOC_VIEWS, PROJECT_VIEWS, projects } from '@/data/projects'
import AgentsView from './AgentsView'
import DocView from './DocView'
import ReelView from './ReelView'
import SitesView from './SitesView'

/**
 * Every sub-view of the board, mounted closed so its content is in the
 * pre-rendered HTML. The URL hash picks the open one (/projects#build-plan).
 */
export default function ProjectViews() {
  const { view, close } = useHashView(PROJECT_VIEWS)
  return (
    <>
      {DOC_VIEWS.map((id) => (
        <DocView key={id} doc={projects.docs[id]} open={view === id} onClose={close} />
      ))}
      <AgentsView open={view === 'ai-agents'} onClose={close} />
      <ReelView open={view === 'reel'} onClose={close} />
      <SitesView open={view === 'sites'} onClose={close} />
    </>
  )
}
