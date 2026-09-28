'use client'

import { lazy, Suspense, useState } from 'react'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'
import { useWebGLAllowed } from '@/hooks/useWebGLAllowed'
import DrumBoundary from './DrumBoundary'
import SiteGrid from './SiteGrid'
import SitePreview from './SitePreview'
import StageBar from './StageBar'

// Three.js stays out of the page's bundle until the drum is first shown (spec §5).
const SiteDrum = lazy(() => import('./SiteDrum'))

/**
 * Funnels and sites (Kraft Projects Board.dc.html:267-286). Wherever WebGL
 * is allowed, the sites cover kape's spinning 3D drum. Everywhere else, and
 * if WebGL fails, they sit in a grid. Each one opens the live preview
 * stacked on top.
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  const allowed = useWebGLAllowed()
  const [failed, setFailed] = useState(false)
  const [site, setSite] = useState<Site | null>(null)
  // Leaving the view (Close, Esc, Back) closes the preview on it too.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setSite(null)
  }
  // Only while open: the pre-rendered page and a closed view keep the grid.
  const drum = open && allowed && !failed
  return (
    <>
      <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
        <StageBar kicker={s.kicker} onClose={onClose} />
        {drum ? (
          <DrumBoundary onFail={() => setFailed(true)}>
            <Suspense fallback={<div className="min-h-0 flex-1" />}>
              <SiteDrum sites={s.sites} onOpen={setSite} onFail={() => setFailed(true)} paused={site !== null} />
            </Suspense>
          </DrumBoundary>
        ) : (
          <SiteGrid sites={s.sites} onOpen={setSite} />
        )}
      </ViewDialog>
      <SitePreview site={site} onClose={() => setSite(null)} />
    </>
  )
}
