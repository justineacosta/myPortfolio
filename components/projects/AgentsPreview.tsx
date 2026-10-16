'use client'

import { useEffect, useRef } from 'react'
import { CheckIcon, MagnifyingGlassIcon, PencilSimpleIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'
import BrandIcon from '@/components/ui/BrandIcon'

/**
 * The AI agents card's preview (spec 2026-10-01-agents-page §5.2): a small
 * RAG chat, then an agent run, in turn. The motion is CSS (app/globals.css,
 * "Agents card preview"). This only marks the preview when it is on screen, so
 * it plays there and nowhere else. At rest it shows the finished chat, which
 * is all that shows under reduced motion or the site's low performance
 * setting. Decorative: the card's link already says what is inside.
 */
export default function AgentsPreview() {
  const p = projects.cards.agents.preview
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-on', e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const chip = 'flex items-center gap-1.5 self-start rounded-full border border-b1 bg-chip px-2.5 py-1 font-mono text-[10px] tracking-[.04em] text-ink3'
  return (
    <div ref={box} aria-hidden className="agents-preview relative mt-1 h-[150px] overflow-hidden rounded-[14px] border border-b1 bg-s0 text-[12px] leading-snug">
      <div className="ap-chat absolute inset-3 flex flex-col gap-2">
        <span className="ap-q self-end rounded-[12px_12px_4px_12px] bg-accent px-3 py-1.5 text-on-accent">{p.question}</span>
        <span className={`ap-search ${chip}`}>
          <MagnifyingGlassIcon size={11} />
          {p.search}
        </span>
        <span className="ap-a max-w-[88%] self-start rounded-[12px_12px_12px_4px] border border-b1 bg-s1 px-3 py-1.5 text-ink2">
          {p.answer} <span className="ml-1 rounded-full bg-wash px-2 py-0.5 font-mono text-[9.5px] whitespace-nowrap text-accent">{p.source}</span>
        </span>
      </div>
      <div className="ap-run absolute inset-3 flex flex-col gap-2">
        <span className={`ap-step-1 ${chip}`}>
          <BrandIcon slug={p.runLogo} size={11} className="block" />
          {p.run[0]}
        </span>
        <span className={`ap-step-2 ${chip}`}>
          <PencilSimpleIcon size={11} />
          {p.run[1]}
        </span>
        <span className="ap-approve flex items-center gap-2 self-start rounded-[12px] border border-b2 bg-s1 px-3 py-2 text-ink">
          {p.approve}
          <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-on-accent">
            <CheckIcon size={10} />
            {p.buttons[0]}
          </span>
          <span className="rounded-full border border-b1 px-2 py-0.5 text-[11px] text-ink2">{p.buttons[1]}</span>
        </span>
      </div>
    </div>
  )
}
