'use client'

import { useHashView } from '@/hooks/useHashView'
import { DOCS } from '@/data/projectDocs'
import { DOC_VIEWS, PROJECT_VIEWS } from '@/data/projects'
import AgentsView from './AgentsView'
import DocView from './DocView'
import PlanView from './PlanView'
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
        <DocView key={id} doc={DOCS[id]} open={view === id} onClose={close} />
      ))}
      <PlanView open={view === 'build-plan'} onClose={close} />
      <AgentsView open={view === 'ai-agents'} onClose={close} />
      <ReelView open={view === 'reel'} onClose={close} />
      <SitesView open={view === 'sites'} onClose={close} />
    </>
  )
}
