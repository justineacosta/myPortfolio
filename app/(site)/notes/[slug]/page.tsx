import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import NoteArticle from '@/components/notes/NoteArticle'
import { notePath, visibleNotes } from '@/data/notes'
import { notFoundIfHidden } from '@/lib/hidden'
import { jsonLd, noteJsonLd } from '@/lib/jsonld'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

/** Only the posts a visitor may see are built; any other slug, a draft in production included, is the 404. */
export function generateStaticParams() {
  return visibleNotes().map((n) => ({ slug: n.slug }))
}
export const dynamicParams = false

const find = (slug: string) => visibleNotes().find((n) => n.slug === slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = find((await params).slug)
  return note ? pageMetadata(notePath(note.slug), note.summary, note.title) : {}
}

/** A guide (spec 2026-10-13-notes): its MDX body from content/notes, inside the post layout. */
export default async function Page({ params }: Props) {
  notFoundIfHidden('/notes')
  const note = find((await params).slug)
  if (!note) notFound()
  const { default: Body } = await import(`@/content/notes/${note.slug}.mdx`)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(noteJsonLd(note)) }} />
      <NoteArticle note={note}>
        <Body />
      </NoteArticle>
    </>
  )
}
