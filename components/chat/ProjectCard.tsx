'use client'

import Image from 'next/image'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import { chat } from '@/data/chat'
import type { CardProject } from '@/lib/chat/samples'

/**
 * A sample system's card, drawn from a `[[project:<slug>]]` line in a reply
 * (the old portfolio's assistant-project-card.tsx, in Kraft's style). An
 * unknown slug draws nothing, so the model can't invent a project into the
 * page. The case study is a standalone page, so this is a plain link.
 */
export default function ProjectCard({ project, onFollow }: { project: CardProject | undefined; onFollow: () => void }) {
  if (!project) return null
  return (
    <a
      href={project.href}
      onClick={() => setTimeout(onFollow, 0)}
      aria-label={`${project.name}: ${chat.card.open}`}
      className="group block overflow-hidden rounded-xl border border-b1 bg-s1 transition-colors duration-250 hover:border-b2"
    >
      <span className="relative block aspect-[16/9] overflow-hidden border-b border-b1 bg-s0">
        <Image src={project.thumb} alt="" fill sizes="320px" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
        <span aria-hidden className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-accent text-on-accent opacity-0 transition-opacity duration-250 group-hover:opacity-100">
          <ArrowUpRightIcon size={14} weight="bold" />
        </span>
      </span>
      <span className="flex flex-col gap-1.5 p-3">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-ink">{project.name}</span>
          <span className="rounded-md border border-wash-b bg-wash px-1.5 py-0.5 font-mono text-[8.5px] tracking-[.1em] text-accent">{chat.card.badge}</span>
        </span>
        {project.trade && <span className="text-[12px] text-ink3 first-letter:uppercase">{project.trade}</span>}
      </span>
    </a>
  )
}
