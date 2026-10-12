import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteArticle from '@/components/notes/NoteArticle'
import NoteCard from '@/components/notes/NoteCard'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { NAV } from '@/data/nav'
import { NOTES, notesPage, visibleNotes } from '@/data/notes'
import { noteJsonLd } from '@/lib/jsonld'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/notes',
}))

const note = NOTES[0]
const hide = (href: string) => {
  const item = NAV.find((n) => n.href === href)!
  item.hidden = true
  return () => {
    item.hidden = false
  }
}

describe('a guide', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('heads the post with its title, summary and date, and ends on a way to start and a way back', () => {
    render(
      <NavigationProvider>
        <NoteArticle note={note}>
          <p>The body.</p>
        </NoteArticle>
      </NavigationProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: note.title })).toBeInTheDocument()
    expect(screen.getByText(note.summary)).toBeInTheDocument()
    expect(screen.getByText('13 October 2026')).toBeInTheDocument()
    expect(screen.getByText('The body.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(notesPage.startLabel) })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: new RegExp(notesPage.allLabel) })).toHaveAttribute('href', '/notes')
  })

  it('drops the way to start a project while Contact is switched off', () => {
    const restore = hide('/contact')
    try {
      render(
        <NavigationProvider>
          <NoteArticle note={note}>
            <p>Body</p>
          </NoteArticle>
        </NavigationProvider>,
      )
      expect(screen.queryByRole('link', { name: new RegExp(notesPage.startLabel) })).toBeNull()
    } finally {
      restore()
    }
  })

  it('is a card on the index: a link to the post with its title, summary and tags', () => {
    render(
      <NavigationProvider>
        <NoteCard note={note} />
      </NavigationProvider>,
    )
    const card = screen.getByRole('link', { name: new RegExp(note.title) })
    expect(card).toHaveAttribute('href', `/notes/${note.slug}`)
    expect(card).toHaveTextContent(note.summary)
    for (const t of note.tags) expect(card).toHaveTextContent(t)
  })

  it('lists posts only while Notes is on, and drafts only under next dev', () => {
    expect(visibleNotes('development').map((n) => n.slug)).toEqual(NOTES.map((n) => n.slug))
    expect(visibleNotes('production')).toEqual(NOTES.filter((n) => !n.draft))
    const restore = hide('/notes')
    try {
      expect(visibleNotes('development')).toEqual([])
    } finally {
      restore()
    }
  })

  it('describes the post to search engines as a BlogPosting by Justine', () => {
    expect(noteJsonLd(note, 'https://example.com')).toMatchObject({
      '@type': 'BlogPosting',
      headline: note.title,
      description: note.summary,
      datePublished: note.date,
      url: `https://example.com/notes/${note.slug}`,
      author: { '@type': 'Person', name: 'Justine Acosta' },
    })
  })
})
