import Shot from '@/components/ui/Shot'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects } from '@/data/projects'
import StageBar from './StageBar'

/**
 * Funnels and sites. Phase 4 puts Kraft's spinning drum and the live preview
 * here. Until then the sites sit in a plain grid, the same list the drum
 * keeps for keyboard and screen-reader users (spec §11).
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  return (
    <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
      <StageBar kicker={s.kicker} onClose={onClose} />
      <div data-backdrop className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <ul data-backdrop className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
          {s.sites.map((site) => (
            <li key={site.file} className="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-b2 bg-s1 shadow-(--shot-shadow)">
              <Shot src={site.shot} hint={s.slotHint} alt={site.name} sizes="200px" />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-veil-deep px-[11px] py-[9px] font-mono text-[10px] tracking-[.1em] text-veil-ink">
                {site.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ViewDialog>
  )
}
