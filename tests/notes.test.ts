import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NOTES, notePath, notesPage, publishedNotes } from '@/data/notes'

const body = (slug: string) => readFileSync(`content/notes/${slug}.mdx`, 'utf8')

describe('the guides', () => {
  it('keeps the list and content/notes equal, both ways', () => {
    const files = readdirSync('content/notes').filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort()
    expect(NOTES.map((n) => n.slug).sort()).toEqual(files)
  })

  it('has unique lowercase-hyphenated slugs, real dates, newest first', () => {
    expect(new Set(NOTES.map((n) => n.slug)).size).toBe(NOTES.length)
    for (const n of NOTES) {
      expect(n.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(n.date))).toBe(false)
      expect(n.title && n.summary).toBeTruthy()
    }
    const dates = NOTES.map((n) => n.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('carries the three guides', () => {
    expect(NOTES.map((n) => n.slug)).toEqual(['taking-the-counter-online', 'what-an-intake-automation-does', 'a-chatbot-that-reads-your-documents'])
  })

  // Follows the data, so publishing a post (draft: false) never breaks it.
  it('leaves drafts out of production and keeps them in development', () => {
    expect(publishedNotes('production')).toEqual(NOTES.filter((n) => !n.draft))
    expect(publishedNotes('development')).toEqual(NOTES)
  })

  it('puts each post at /notes/<slug>', () => {
    expect(notePath('a-b')).toBe('/notes/a-b')
    expect(notesPage).toMatchObject({ startLabel: 'Start a project', allLabel: 'All guides', eyebrow: 'NOTES / GUIDE' })
  })

  it('keeps every post honest: samples named as samples, no figures, no em dashes', () => {
    for (const slug of ['what-an-intake-automation-does', 'a-chatbot-that-reads-your-documents']) {
      expect(body(slug), slug).toMatch(/sample/i)
      expect(body(slug), slug).toMatch(/fictional/i)
    }
    for (const n of NOTES) {
      expect(body(n.slug), n.slug).not.toMatch(/\d+\s?%/)
      expect(body(n.slug), n.slug).not.toContain('—')
      // Each guide links the build it describes.
      expect(body(n.slug), n.slug).toMatch(/\]\(\/projects#[a-z-]+\)/)
    }
  })
})
