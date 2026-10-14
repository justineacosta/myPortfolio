'use client'

import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'
import { track } from '@/lib/analytics'
import DrumBoundary from './DrumBoundary'
import SiteCarousel from './SiteCarousel'
import SitePreview from './SitePreview'
import StageBar from './StageBar'

// Three.js stays out of the page's bundle until the drum is first shown (spec §5).
const SiteDrum = lazy(() => import('./SiteDrum'))

const noSubscribe = () => () => {}

/**
 * Funnels and sites (Kraft Projects Board.dc.html:267-286). The sites cover
 * kape's spinning 3D drum, for every visitor: touch screens, reduced motion
 * and slow devices included (the drum runs lighter at the low perf tier). If
 * WebGL can't run it, Kraft's own spin carousel stands in, and the carousel is
 * also what the pre-rendered page carries. Each site opens the live preview
 * stacked on top.
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  // False on the server and in the pre-rendered HTML, true once hydrated.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const [failed, setFailed] = useState(false)
  const [site, setSite] = useState<Site | null>(null)
  const openSite = (picked: Site) => {
    track('Sample site opened', { site: picked.name })
    setSite(picked)
  }
  // Leaving the view (Close, Esc, Back) closes the preview on it too.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setSite(null)
  }
  // Only while open: the pre-rendered page and a closed view keep the carousel.
  const drum = open && mounted && !failed
  return (
    <>
      <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
        <StageBar kicker={s.kicker} onClose={onClose} />
        {drum ? (
          <DrumBoundary onFail={() => setFailed(true)}>
            <Suspense fallback={<div className="min-h-0 flex-1" />}>
              <SiteDrum sites={s.sites} onOpen={openSite} onFail={() => setFailed(true)} paused={site !== null} />
            </Suspense>
          </DrumBoundary>
        ) : (
          <SiteCarousel sites={s.sites} onOpen={openSite} running={open && site === null} />
        )}
      </ViewDialog>
      <SitePreview site={site} onClose={() => setSite(null)} />
    </>
  )
}
