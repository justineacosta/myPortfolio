'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CaretLeftIcon, CaretRightIcon, PlayIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import Shot from '@/components/ui/Shot'
import { NAV_BUTTON, TAG } from '@/components/ui/styles'
import { CARDS, CLIENTS, testimonialsPage as t } from '@/data/testimonials'
import { isPlaceholder } from '@/lib/placeholder'

/**
 * Kraft's testimonials (KraftScreens.dc.html:335-390). On the left, a video
 * player with a tab per real client. On the right, a card for every client,
 * then every sample (logo, organisation, my role there or SAMPLE SYSTEM, one
 * line on the work, tags), `perPage` at a time with a pager under them. Until a video
 * exists, the player shows Kraft's empty poster slot with its play button
 * disabled; a client with a photo but no video gets the photo, captioned with
 * their name, and no play button. The caption sits on a dark fade, so it uses
 * the stage ink in both themes.
 */
/** An arrow at the first or last page: dimmed, and no hover. */
const OFF = 'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-b1 disabled:hover:text-ink2'

export default function Testimonials() {
  const [pick, setPick] = useState(0)
  const [page, setPage] = useState(0)
  const pages = Math.ceil(CARDS.length / t.perPage)
  const shown = CARDS.slice(page * t.perPage, (page + 1) * t.perPage)
  const c = CLIENTS[pick]
  const hasVideo = !isPlaceholder(c.video.src)
  const photo = !isPlaceholder(c.video.poster)
  const length = isPlaceholder(c.video.duration) ? t.noLength : c.video.duration
  return (
    <Frame lit={{ x: '78%', alpha: 0.55, stop: '56%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
      <div className="flex min-w-[min(250px,100%)] flex-[1_1_320px] flex-col gap-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-b1 bg-s0">
          {hasVideo ? (
            <video
              key={c.video.src}
              src={c.video.src}
              poster={isPlaceholder(c.video.poster) ? undefined : c.video.poster}
              controls
              playsInline
              preload="none"
              aria-label={`${t.caption} ${c.n}`}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <>
              <Shot src={c.video.poster} hint={t.posterHint} alt={photo ? c.name : ''} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-45% to-poster-fade" />
              {!photo && (
                <button
                  type="button"
                  disabled
                  aria-label={t.play}
                  className="absolute top-1/2 left-1/2 grid size-[66px] -translate-1/2 cursor-not-allowed place-items-center rounded-full bg-accent text-2xl text-on-accent shadow-[0_16px_40px_-12px_var(--glow)]"
                >
                  <PlayIcon weight="fill" aria-hidden />
                </button>
              )}
              <div className="pointer-events-none absolute inset-x-[18px] bottom-4 flex flex-col gap-1 text-veil-ink">
                <span className="text-[15px] font-semibold">
                  {t.caption} {c.n}
                </span>
                <span className="font-mono text-[9.5px] tracking-[.1em] opacity-80">
                  {photo ? c.name : `${length} · ${t.tapToPlay}`}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CLIENTS.map((cl, i) => (
            <button
              key={cl.n}
              type="button"
              aria-pressed={i === pick}
              onClick={() => setPick(i)}
              className={`min-h-11 flex-[1_1_110px] cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-medium text-ink-soft transition-colors duration-250 ${i === pick ? 'border-wash-b bg-wash' : 'border-b1 bg-s0 hover:border-b2'}`}
            >
              {t.tab} {cl.n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-[min(260px,100%)] flex-[2_1_420px] flex-col gap-[clamp(11px,1.3cqw,16px)]">
        {shown.map((cl) => (
          <article
            key={cl.n}
            className="relative flex flex-wrap items-start gap-3.5 overflow-hidden rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 p-[18px] transition-[border-color,translate] duration-350 hover:-translate-y-0.5 hover:border-b2"
          >
            <span aria-hidden className="absolute right-4 -bottom-2 text-[58px] leading-none font-extrabold tracking-[-.05em] text-wash">
              {cl.n}
            </span>
            <span className="grid size-[50px] shrink-0 place-items-center rounded-xl border border-b1 bg-s3">
              <Image src={cl.logo} alt={`${cl.org} logo`} width={36} height={36} className="size-9 rounded-full object-cover" />
            </span>
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2">
              <div className="flex flex-wrap items-center gap-[9px]">
                <h2 className="text-[17px] font-semibold">{cl.org}</h2>
                <span className="rounded-lg border border-wash-b bg-wash px-[9px] py-1 font-mono text-[9px] tracking-[.1em] text-accent">{cl.work}</span>
              </div>
              <p className="relative max-w-[60ch] text-sm leading-[1.55] text-ink-soft">{cl.line}</p>
              <div className="flex flex-wrap gap-1.5">
                {cl.tags.map((tag, i) => (
                  <span key={`${cl.n}-${i}`} className={TAG}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {pages > 1 && (
          <nav aria-label={t.pager} className="mt-auto flex items-center justify-end gap-[7px] pt-1">
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label={t.prevPage} className={`${NAV_BUTTON} ${OFF}`}>
              <CaretLeftIcon aria-hidden />
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`${t.page} ${i + 1}`}
                aria-current={i === page ? 'page' : undefined}
                className={`${NAV_BUTTON} font-mono text-[11px] ${i === page ? 'border-wash-b bg-wash text-accent' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === pages - 1} aria-label={t.nextPage} className={`${NAV_BUTTON} ${OFF}`}>
              <CaretRightIcon aria-hidden />
            </button>
          </nav>
        )}
      </div>
    </Frame>
  )
}
