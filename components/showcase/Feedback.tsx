'use client'

import { useState, type CSSProperties } from 'react'
import { PauseIcon, PlayIcon, QuotesIcon, StarIcon } from '@phosphor-icons/react/ssr'
import { FEEDBACK, showcase } from '@/data/showcase'

/**
 * What people say about the flagship (kape Flagship.tsx feedback marquee).
 * The quotes drift past, drawn twice for a seamless loop; the second copy is
 * hidden from assistive tech. They pause under the pointer, while focused,
 * and with the button (WCAG 2.2.2). With reduced motion they stand still and
 * scroll by hand (globals.css .feedback).
 */
export default function Feedback() {
  const fb = showcase.feedback
  const [paused, setPaused] = useState(false)
  return (
    <section aria-labelledby="feedback-title" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{fb.kicker}</span>
          <h2 id="feedback-title" className="text-[clamp(20px,2.6cqw,32px)] leading-[1.1] font-bold tracking-[-.025em]">
            {fb.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? fb.playLabel : fb.pauseLabel}
          className="feedback-toggle flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-b1 bg-s2 px-3.5 text-[12.5px] font-medium text-ink2 transition-colors duration-250 hover:border-b2 hover:text-ink"
        >
          {paused ? <PlayIcon size={14} weight="fill" aria-hidden className="text-accent" /> : <PauseIcon size={14} weight="fill" aria-hidden className="text-accent" />}
          {paused ? fb.play : fb.pause}
        </button>
      </header>
      <div
        role="region"
        aria-label={fb.reelLabel}
        tabIndex={0}
        data-paused={paused || undefined}
        className="feedback edge-fade overflow-hidden py-2"
        style={{ '--fade': '6%' } as CSSProperties}
      >
        <ul className="flex w-max animate-marquee gap-5" style={{ '--marq': `${fb.seconds}s` } as CSSProperties}>
          {[0, 1].map((copy) =>
            FEEDBACK.map((q, i) => (
              <li key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined} className="shrink-0">
                <figure className="relative m-0 flex h-full w-[clamp(260px,24vw,340px)] flex-col gap-3.5 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-6 pt-7 pb-6">
                  <QuotesIcon weight="fill" size={26} aria-hidden className="absolute top-4 right-5 text-wash-b" />
                  <div role="img" aria-label={`${q.rating} ${fb.stars}`} className="flex gap-0.5 text-accent">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <StarIcon key={n} size={14} weight={n < q.rating ? 'fill' : 'regular'} aria-hidden />
                    ))}
                  </div>
                  <blockquote className="m-0 text-[14px] leading-[1.6] text-ink2">{q.quote}</blockquote>
                  <figcaption className="mt-auto flex flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold">{q.name}</span>
                    <span className="font-mono text-[10px] tracking-[.06em] text-ink3">
                      {q.context} · {q.date}
                    </span>
                  </figcaption>
                </figure>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  )
}
