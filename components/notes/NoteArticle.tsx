import type { ReactNode } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { CTA } from '@/components/projects/styles'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { isHidden } from '@/data/nav'
import { notesPage, type Note } from '@/data/notes'
import { formatNoteDate } from './date'

/**
 * A guide's page (spec 2026-10-13-notes): its title, summary and date, the
 * MDX body (styled by mdx-components.tsx), then a way to start a project,
 * which leaves with the Contact page, and a way back to every guide.
 */
export default function NoteArticle({ note, children }: { note: Note; children: ReactNode }) {
  const p = notesPage
  return (
    <article className="mx-auto flex w-full max-w-[68ch] flex-col gap-4">
      <header className="flex flex-col gap-3 pb-2">
        <span className="font-mono text-[10.5px] tracking-[.14em] text-accent">
          {p.eyebrow} · <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
        </span>
        <h1 className="text-[clamp(28px,4.2cqw,44px)] leading-[1.08] font-semibold tracking-[-.035em] text-ink">{note.title}</h1>
        <p className="text-[16px] leading-[1.55] text-ink3">{note.summary}</p>
      </header>

      {children}

      <footer className="mt-6 flex flex-col gap-4 rounded-[18px] border border-b1 bg-linear-to-b from-s1 to-s2 p-5">
        {!isHidden('/contact') && (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-semibold tracking-[-.02em] text-ink">{p.startLine}</p>
            <ShellLink href="/contact" className={`${CTA} self-start text-[11px]`}>
              {p.startLabel} <ArrowRightIcon size={13} aria-hidden />
            </ShellLink>
          </div>
        )}
        <ShellLink href="/notes" className="flex items-center gap-1.5 self-start text-[13px] text-ink3 transition-colors hover:text-ink">
          <ArrowLeftIcon size={13} aria-hidden /> {p.allLabel}
        </ShellLink>
      </footer>
    </article>
  )
}
