/**
 * The guides on /notes (spec 2026-10-13-notes): one line per post, newest
 * first. The body of each is content/notes/<slug>.mdx, and tests/notes.test.ts
 * keeps the two equal. The index, the sitemap, ⌘K and Lumen read this list,
 * so none of them compiles MDX.
 *
 * `draft: true` keeps a post to `next dev` (localhost:3000/notes). To publish
 * one, set it to false, and switch /notes on in data/nav.ts.
 */
import { isHidden } from './nav'

export type Note = { slug: string; title: string; summary: string; date: string; tags: string[]; draft: boolean }

export const NOTES: Note[] = [
  {
    slug: 'taking-the-counter-online',
    title: 'Taking the counter online: how a barangay moved its requests to the web',
    summary: 'Requests, tracking and receipts, online, for a local government office.',
    date: '2026-10-13',
    tags: ['Web apps', 'Government'],
    draft: true,
  },
  {
    slug: 'what-an-intake-automation-does',
    title: 'What an intake automation actually does',
    summary: 'From a filled-in form to a priced reply, without anyone retyping a field.',
    date: '2026-10-13',
    tags: ['Automation'],
    draft: true,
  },
  {
    slug: 'a-chatbot-that-reads-your-documents',
    title: 'A chatbot that answers from your own documents',
    summary: 'What RAG means for a business: answers from your price sheet, with the source, and a hand-off when it doesn’t know.',
    date: '2026-10-13',
    tags: ['AI agents'],
    draft: true,
  },
]

/** The posts a visitor can see: every post under `next dev`, only the finished ones in production. */
export const publishedNotes = (env: string | undefined = process.env.NODE_ENV): Note[] =>
  env === 'development' ? NOTES : NOTES.filter((n) => !n.draft)

/** The posts the site lists and serves: none while /notes is switched off. The routes, sitemap, ⌘K and Lumen all read this. */
export const visibleNotes = (env: string | undefined = process.env.NODE_ENV): Note[] => (isHidden('/notes') ? [] : publishedNotes(env))

export const notePath = (slug: string) => `/notes/${slug}`

/** The section's own copy. */
export const notesPage = {
  title: ['Guides for', 'running lighter.'] as const,
  lede: 'Plain-language guides to the systems I build: what they do, how they work, and what they take off your plate.',
  description: 'Guides for business owners on automations, AI chatbots and web apps: what they do, how they work, and what they take off your plate.',
  eyebrow: 'NOTES / GUIDE',
  startLabel: 'Start a project',
  startLine: 'Want something like this for your business?',
  allLabel: 'All guides',
  empty: 'The first guides are on their way.',
}
