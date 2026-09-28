import Image from 'next/image'
import { projects, type Site } from '@/data/projects'

/**
 * The sample sites as a grid of buttons. It is what the server renders and
 * what touch screens, reduced motion, the low perf tier and a failed drum
 * get (spec §5). Each button opens the site's preview.
 */
export default function SiteGrid({ sites, onOpen }: { sites: Site[]; onOpen: (site: Site) => void }) {
  const s = projects.sitesView
  return (
    <div data-backdrop className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
      <ul
        data-backdrop
        aria-label={s.listLabel}
        className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
      >
        {sites.map((site) => (
          <li key={site.file}>
            <button
              type="button"
              onClick={() => onOpen(site)}
              aria-label={`${s.open} ${site.name}`}
              className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[14px] border border-b2 bg-s1 p-0 shadow-(--shot-shadow) transition-colors duration-250 hover:border-accent"
            >
              <Image src={site.thumb} alt="" fill sizes="(max-width: 700px) 45vw, 200px" className="object-cover object-top" />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-veil-deep px-[11px] py-[9px] text-left font-mono text-[10px] tracking-[.1em] text-veil-ink"
              >
                {site.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
