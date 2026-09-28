'use client'

import { useState } from 'react'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'
import SiteGrid from './SiteGrid'
import SitePreview from './SitePreview'
import StageBar from './StageBar'

/**
 * Funnels and sites (Kraft Projects Board.dc.html:267-286). The sites sit on
 * a dark stage, and each one opens the live preview stacked on top.
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  const [site, setSite] = useState<Site | null>(null)
  // Leaving the view (Close, Esc, Back) closes the preview on it too.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setSite(null)
  }
  return (
    <>
      <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
        <StageBar kicker={s.kicker} onClose={onClose} />
        <SiteGrid sites={s.sites} onOpen={setSite} />
      </ViewDialog>
      <SitePreview site={site} onClose={() => setSite(null)} />
    </>
  )
}
