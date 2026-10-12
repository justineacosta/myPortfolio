'use client'

import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { parseBlocks, parseInline } from '@/lib/chat/rich'
import type { CardProject } from '@/lib/chat/samples'
import LeadForm from './LeadForm'
import ProjectCard from './ProjectCard'

const LINK = 'font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent'

type Props = {
  text: string
  /** The site's paths a link may lead to; a link to any other path shows as its label. */
  known: ReadonlySet<string>
  projects: CardProject[]
  /** False on every reply after the first that asks for the form, so a chat never holds two. */
  allowLeadForm: boolean
  /** What the form's message starts with. */
  leadDraft?: string
  /** Goes to a site page through the shell's router. */
  go: (href: string) => void
  /** Called when a link leaves the chat. */
  onFollow: () => void
}

/** A line of a reply: bold, italic, code and links. A site page goes through the shell's router; a standalone page and other sites are plain links. */
function Line({ text, known, go, onFollow }: { text: string } & Pick<Props, 'known' | 'go' | 'onFollow'>) {
  return parseInline(text).map((run, i): ReactNode => {
    if (run.kind === 'text') return run.text
    if (run.kind !== 'link') {
      if (run.kind === 'bold') return <strong key={i} className="font-semibold text-ink">{run.text}</strong>
      if (run.kind === 'italic') return <em key={i}>{run.text}</em>
      return <code key={i} className="rounded bg-chip px-1 py-0.5 font-mono text-[12px]">{run.text}</code>
    }
    const { href } = run
    if (href.startsWith('/') || href.startsWith('#')) {
      if (!known.has(href.split('#')[0] || '/')) return run.text
      const onClick = (e: MouseEvent) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        if (/\.html?$/.test(href)) {
          // Let the browser follow the file first; unmounting the anchor inside its own click could cancel that.
          setTimeout(onFollow, 0)
          return
        }
        e.preventDefault()
        go(href)
        onFollow()
      }
      return <a key={i} href={href} onClick={onClick} className={LINK}>{run.text}</a>
    }
    return <a key={i} href={href} target="_blank" rel="noreferrer noopener" className={LINK}>{run.text}</a>
  })
}

/** One of Lumen's replies: paragraphs, bullets, and the project card or contact form a reply asks for. */
export default function RichText({ text, known, projects, allowLeadForm, leadDraft, go, onFollow }: Props) {
  const blocks = useMemo(() => parseBlocks(text), [text])
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        if (block.kind === 'p') return <p key={i}><Line text={block.text} known={known} go={go} onFollow={onFollow} /></p>
        if (block.kind === 'ul') {
          return (
            <ul key={i} className="flex flex-col gap-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[.55em] size-1 shrink-0 rounded-full bg-accent" />
                  <span><Line text={item} known={known} go={go} onFollow={onFollow} /></span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.kind === 'project') return <ProjectCard key={i} project={projects.find((p) => p.key === block.slug)} onFollow={onFollow} />
        return allowLeadForm ? <LeadForm key={i} draft={leadDraft} /> : null
      })}
    </div>
  )
}
