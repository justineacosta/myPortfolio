import NoteCard from '@/components/notes/NoteCard'
import PageHeader from '@/components/ui/PageHeader'
import { notesPage, visibleNotes } from '@/data/notes'
import { notFoundIfHidden } from '@/lib/hidden'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/notes', notesPage.description)

/** The guides (spec 2026-10-13-notes): every published post, newest first. */
export default function Page() {
  notFoundIfHidden('/notes')
  const notes = visibleNotes()
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/notes" title={notesPage.title} lede={notesPage.lede} />
      {notes.length ? (
        <div className="grid grid-cols-1 gap-[clamp(11px,1.3cqw,18px)] sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <NoteCard key={n.slug} note={n} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-ink3">{notesPage.empty}</p>
      )}
    </section>
  )
}
