import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import { BODY, CARD, TITLE } from '@/components/projects/styles'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { notePath, type Note } from '@/data/notes'
import { formatNoteDate } from './date'

/** A guide on the /notes index (spec 2026-10-13-notes): a board card that opens the post. */
export default function NoteCard({ note }: { note: Note }) {
  return (
    <ShellLink href={notePath(note.slug)} className={`${CARD} min-w-0`}>
      <span className="font-mono text-[10px] tracking-[.14em] text-ink3">{formatNoteDate(note.date).toUpperCase()}</span>
      <h2 className={TITLE}>{note.title}</h2>
      <p className={BODY}>{note.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        {note.tags.map((t) => (
          <span key={t} className="rounded-full border border-b1 bg-s0 px-2.5 py-1 text-[11.5px] text-ink2">
            {t}
          </span>
        ))}
        <ArrowUpRightIcon size={14} aria-hidden className="ml-auto text-accent" />
      </div>
    </ShellLink>
  )
}
