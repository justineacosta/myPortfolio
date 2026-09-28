'use client'

import { useState } from 'react'
import { PlayIcon, QuotesIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import Shot from '@/components/ui/Shot'
import { CARD, TAG } from '@/components/ui/styles'
import { CLIENTS, testimonialsPage as t } from '@/data/testimonials'
import { isPlaceholder } from '@/lib/placeholder'

/**
 * Kraft's testimonials (KraftScreens.dc.html:335-390). On the left, a video
 * player with a tab per client. On the right, the picked client's quote
 * featured above every client's card. Until a video exists, the player shows
 * Kraft's empty poster slot with its play button disabled. The caption sits
 * on a dark fade, so it uses the stage ink in both themes.
 */
export default function Testimonials() {
  const [pick, setPick] = useState(0)
  const c = CLIENTS[pick]
  const hasVideo = !isPlaceholder(c.video.src)
  const length = isPlaceholder(c.video.duration) ? t.noLength : c.video.duration
  return (
    <Frame lit={{ x: '78%', alpha: 0.55, stop: '56%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
      <div className="flex min-w-[250px] flex-[1_1_320px] flex-col gap-3">
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
              <Shot src={c.video.poster} hint={t.posterHint} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-45% to-poster-fade" />
              <button
                type="button"
                disabled
                aria-label={t.play}
                className="absolute top-1/2 left-1/2 grid size-[66px] -translate-1/2 cursor-not-allowed place-items-center rounded-full bg-accent text-2xl text-on-accent shadow-[0_16px_40px_-12px_var(--glow)]"
              >
                <PlayIcon weight="fill" aria-hidden />
              </button>
              <div className="pointer-events-none absolute inset-x-[18px] bottom-4 flex flex-col gap-1 text-veil-ink">
                <span className="text-[15px] font-semibold">
                  {t.caption} {c.n}
                </span>
                <span className="font-mono text-[9.5px] tracking-[.1em] opacity-80">
                  {length} · {t.tapToPlay}
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

      <div className="flex min-w-[260px] flex-[2_1_420px] flex-col gap-[clamp(11px,1.3cqw,16px)]">
        <div className={`${CARD} flex flex-col gap-3.5 p-[clamp(16px,1.8cqw,24px)]`}>
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{t.featured}</span>
          <p className="text-[clamp(15px,1.8cqw,21px)] leading-[1.45] tracking-[-.015em]">{c.quote}</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-b1 pt-3">
            <span aria-hidden className="grid size-[38px] place-items-center rounded-xl border border-b1 bg-s3 font-mono text-[10px] text-ink3">
              {c.n}
            </span>
            <div className="flex flex-col gap-[3px]">
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="font-mono text-[9.5px] tracking-[.06em] text-ink3">{c.role}</span>
            </div>
            <span className="ml-auto rounded-[9px] border border-wash-b bg-wash px-2.5 py-1.5 font-mono text-[9.5px] text-accent">{c.tag}</span>
          </div>
        </div>
        {CLIENTS.map((cl) => (
          <article
            key={cl.n}
            className="relative flex flex-wrap items-start gap-3.5 overflow-hidden rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 p-[18px] transition-[border-color,translate] duration-350 hover:-translate-y-0.5 hover:border-b2"
          >
            <span aria-hidden className="absolute right-4 -bottom-2 text-[58px] leading-none font-extrabold tracking-[-.05em] text-wash">
              {cl.n}
            </span>
            <span aria-hidden className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-b1 bg-s3">
              <QuotesIcon weight="fill" size={17} className="text-accent opacity-85" />
            </span>
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2">
              <div className="flex flex-wrap items-center gap-[9px]">
                <h2 className="text-[15px] font-semibold">{cl.name}</h2>
                <span className="rounded-lg border border-wash-b bg-wash px-[9px] py-1 font-mono text-[9px] tracking-[.1em] text-accent">{cl.role}</span>
              </div>
              <p className="relative text-[13px] leading-[1.55] text-ink3">{cl.quote}</p>
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
      </div>
    </Frame>
  )
}
