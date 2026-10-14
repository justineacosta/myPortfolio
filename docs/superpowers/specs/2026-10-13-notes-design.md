# Notes (guides for prospective clients): design

**Date:** 2026-10-13
**Status:** Design approved 2026-10-13 in chat; spec awaiting review
**Branch:** `feat/notes`, stacked on `feat/san-fernando-case-study` (PR #67). The first post links the case study, and both branches edit `lib/chat/prompt.ts`, so stacking avoids a conflict. Retarget to `main` once #67 merges.

## 1. Goal

A Notes section of short guides that bring prospective clients in from search. Each guide explains a problem Justine solves, walks through a build the site already shows, and ends with a way to start a project. Lumen can point visitors to the right guide.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
| --- | --- |
| Audience | Prospective clients (business owners), written for search |
| First posts | Claude drafts three; Justine edits and approves each one before it goes live |
| Format | MDX files with `@next/mdx`, as this Next version's guide (`node_modules/next/dist/docs/01-app/02-guides/mdx.md`) describes |
| Placement | A sidebar item after Services, crumb `NOTES / GUIDES`. Phone tabs unchanged. |
| Review | A `draft` flag per post. Drafts show only under `next dev`. The page ships switched off. |

## 3. Out of scope

- No comments, RSS, newsletter, search box, pagination, reading time or author pages.
- No typography plugin. Posts are styled through `mdx-components.tsx`.
- No change to the phone tab bar or Home's Bento.
- No metrics, results or client names other than what the site already states (§6).

## 4. Architecture

### 4.1 Packages and config

- Add `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react` and `@types/mdx`.
- `next.config.ts` wraps the config in `createMDX()` and adds `'md'` and `'mdx'` to `pageExtensions`, as the guide shows. The existing `headers()` stays. Use no remark or rehype plugins: under Turbopack, plugins must be serialisable, and none are needed.
- `mdx-components.tsx` at the repo root (required by the App Router) maps `h2`, `h3`, `p`, `ul`, `ol`, `li`, `a`, `strong` and `blockquote` to Kraft's type and colour tokens, using the same scale as the case study view (`text-[14px] leading-[1.55] text-ink2`; headings `font-semibold tracking-[-.02em]`). Links use the site's link style. An internal link goes through `ShellLink`, and an external one opens with `rel="noopener"`.

### 4.2 Posts and the list (`data/notes.ts`)

```ts
export type Note = { slug: string; title: string; summary: string; date: string /* YYYY-MM-DD */; tags: string[]; draft: boolean }
export const NOTES: Note[]                      // newest first
export const publishedNotes = (env = process.env.NODE_ENV): Note[]   // drafts only when env === 'development'
export const notePath = (slug: string) => `/notes/${slug}`
```

Each post's body is `content/notes/<slug>.mdx`: Markdown only, with no frontmatter and no exports. The title, summary and date live in `NOTES`, so the index, sitemap, ⌘K and Lumen read plain TypeScript and never compile MDX. A test keeps the list and the folder equal in both directions.

### 4.3 Routes

- **`app/(site)/notes/page.tsx` (the index):** `notFoundIfHidden('/notes')`, then `PageHeader` with the title `['Guides for', 'running lighter.']` and a lede, then one card per published post (title, summary, a formatted date, tags). The cards use the board's `CARD`, `TITLE` and `BODY` styles, and each links to `notePath(slug)`. It has its own metadata through `pageMetadata('/notes', …)`.
- **`app/(site)/notes/[slug]/page.tsx` (a post):**
  - `generateStaticParams()` returns the published slugs, and `dynamicParams = false`, so any other slug, including a draft in production, gets the 404.
  - It calls `notFoundIfHidden('/notes')`.
  - It renders `await import(\`@/content/notes/${slug}.mdx\`)` between a header (an eyebrow `NOTES / GUIDE` with the date, the `h1` title, the summary) and a foot.
  - The foot holds a "Start a project" link to `/contact`, which is dropped when Contact is hidden, and "All guides" back to `/notes`.
  - `generateMetadata` gives the title, the summary as description, and the canonical `/notes/<slug>`.
  - BlogPosting JSON-LD (`headline`, `datePublished`, `author`: Justine) is added through `lib/jsonld.ts`.

### 4.4 Navigation and wiring

- **`data/nav.ts`:** `NAV` gains `{ href: '/notes', label: 'Notes', hint: 'GUIDES', eyebrow: 'NOTES / GUIDES', icon: NotebookIcon, hidden: true }` after Services. Hidden at launch (§5). The sidebar renumbers itself.
- **Services:** a "Read the guides →" link at the foot of the page, gone while `/notes` is hidden.
- **Sitemap:** `/notes` comes through `indexedPaths()`, and `app/sitemap.ts` adds each published post's path while `/notes` is visible.
- **⌘K:** `lib/commands.ts` adds one entry per published post (label: its title, `href`: its path, an icon), all dropped while `/notes` is hidden, like every other command.
- **Lumen:** `lib/chat/prompt.ts` gets a `# Guides (/notes)` section listing each published post's title, summary and path, but only while `/notes` is visible. `lib/chat/pages.ts` gets a `/notes` page summary. The keyless fallback is unchanged.

## 5. Drafts and review

- All three posts ship with `draft: true`, and `/notes` ships with `hidden: true`.
- Under `next dev`, `publishedNotes()` includes drafts, so Justine can read them at `localhost:3000/notes` after setting `hidden: false` locally.
- In production, drafts are left out of `generateStaticParams`, the index, the sitemap, ⌘K and Lumen.
- To publish, Justine edits the `.mdx`, sets `draft: false`, and sets the page's `hidden: false`.

## 6. The three drafts

All three follow the same rules:
- First person, plain words for a business owner, about 700–900 words, with `##` section headings.
- No invented figures, results or quotes.
- Any sample build is named as a sample (a fictional business).
- Only San Fernando is client work, and only with facts from the SanFernandoWeb README and `projects.caseStudy`.
- Each post links to the build it describes.

| Slug | Title | Summary | Built on |
| --- | --- | --- | --- |
| `taking-the-counter-online` | Taking the counter online: how a barangay moved its requests to the web | Requests, tracking and receipts, online, for a local government office. | `projects.caseStudy`, SanFernandoWeb README §Features and §Security; links `/projects#san-fernando` |
| `what-an-intake-automation-does` | What an intake automation actually does | From a form at 9pm to a follow-up at 9:01, without anyone copying fields. | The Harbor & Pine *Moving estimate* flow in `data/automations.ts` (a sample); links `/projects#automations` |
| `a-chatbot-that-reads-your-documents` | A chatbot that answers from your own documents | What RAG means for a business: answers from your price sheet, with the source, and a hand-off when it doesn't know. | Harbor & Pine's RAG chatbot in `data/agents.ts` (a sample; the piano question); links `/projects#ai-agents` |

Dates: `2026-10-13` for all three, with tags drawn from `Automation`, `AI agents`, `Web apps`, `Government`.

## 7. Testing

- **Unit:**
  - `NOTES` and `content/notes/*.mdx` match in both directions; slugs are unique and lowercase-hyphenated; dates are valid; the list is newest first.
  - `publishedNotes('production')` leaves drafts out, and `publishedNotes('development')` keeps them.
  - The nav lists Notes after Services and renumbers. While hidden, `/notes` is gone from the sidebar, ⌘K, sitemap and Lumen.
  - ⌘K, sitemap and Lumen list exactly the published posts.
  - The Services "Read the guides" link follows `/notes`'s hidden flag.
  - `mdx-components` maps an internal link to `ShellLink`.
- **e2e (desktop and phone):** the tests follow the data (`NAV` and `NOTES`, imported like `e2e/chat.spec.ts` imports site data), so publishing doesn't break them.
  - **While `/notes` is hidden or nothing is published:** `/notes` and every draft's path return the 404, and the sidebar has no Notes.
  - **Once a post is published:** the sidebar's Notes opens the index, the newest post opens and shows its title and "Start a project", an unknown slug returns the 404, nothing scrolls sideways, and there are no console errors.
  - The unit tests render the index and a post with drafts included, so the page and post layout are tested before anything is published.
- `typecheck`, `lint`, `test` and `e2e` pass, and `next build` succeeds with the MDX config under Turbopack.
