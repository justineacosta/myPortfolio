/**
 * Lumen's reply format, ported from the old portfolio
 * (the myPortfolioV3 repo, src/components/rich-text.tsx) as plain functions so it can be
 * tested without a browser: paragraphs, `- ` bullets, **bold**, _italic_,
 * `code`, [links](url), and two directives alone on their line:
 * `[[project:<slug>]]` (a sample system's card) and `[[lead-form]]` (the
 * in-chat contact form). A visitor never sees a raw `[[…]]`.
 */

export type Block = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] } | { kind: 'project'; slug: string } | { kind: 'lead-form' }

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'bold' | 'italic' | 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

/** `[[lead-form]]` or `[[project:some-slug]]`, alone on its line, matched lowercased so `[[Project:Ostler]]` still resolves. */
const DIRECTIVE_RE = /^\[\[([a-z-]+)(?::([a-z0-9-]+))?\]\]$/

/** A line that could still grow into a directive while the reply streams in: `[`, `[[`, `[[proj`, `[[project:os`, `[[project:ostler]`. */
const PARTIAL_RE = /^\[{1,2}[a-z0-9:-]*\]{0,2}$/i

/** The marker the in-chat form is asked for with, as it appears in a reply. */
export const LEAD_FORM = '[[lead-form]]'

/** Whether a reply asks for the in-chat form. */
export const hasLeadForm = (text: string) => text.toLowerCase().includes(LEAD_FORM)

/** The last line of defence: a directive inline with prose, malformed or unknown is removed, never shown. */
export function stripDirectives(text: string): string {
  return text.replace(/\[\[[^\]\n]*\]\]/g, '').replace(/[ \t]{2,}/g, ' ')
}

/** A reply as blocks. Lines that could still become a directive are held back, so a partial marker never flashes up mid-stream. */
export function parseBlocks(text: string): Block[] {
  const out: Block[] = []
  let para: string[] = []
  let list: string[] | null = null
  const flushPara = () => {
    const body = stripDirectives(para.join(' ')).trim()
    // A paragraph that was nothing but a stray directive strips to empty, and would leave a gap.
    if (body) out.push({ kind: 'p', text: body })
    para = []
  }
  const flushList = () => {
    if (list?.length) out.push({ kind: 'ul', items: list.map((i) => stripDirectives(i).trim()).filter(Boolean) })
    list = null
  }

  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const directive = DIRECTIVE_RE.exec(line.trim().toLowerCase())
    if (directive) {
      flushPara()
      flushList()
      const [, name, arg] = directive
      if (name === 'lead-form') out.push({ kind: 'lead-form' })
      else if (name === 'project' && arg) out.push({ kind: 'project', slug: arg })
      continue
    }
    if (PARTIAL_RE.test(line.trim())) continue
    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      flushPara()
      list ??= []
      list.push(bullet[1])
      continue
    }
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return out
}

/** Whether a link may be followed at all: a site path, an anchor, or an http(s) URL. */
export function isSafeUrl(href: string): boolean {
  if (href.startsWith('/') && !href.startsWith('//')) return true
  if (href.startsWith('#')) return true
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** A link, whose URL may hold one level of parentheses, so `javascript:alert(1)` is taken whole, not left dangling. */
const LINK_RE = /^\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)$/
const INLINE_RE = /(\[[^\]]+\]\((?:[^()\s]|\([^()\s]*\))+\))|(\*\*[^*]+\*\*)|(__[^_]+__)|(_[^_]+_)|(\*[^*]+\*)|(`[^`]+`)/g

/**
 * A line of text as runs. A link becomes a link only when its URL is safe;
 * otherwise only its label shows. Whether a site path is one the site has is
 * the renderer's call, since only it knows the site's pages.
 */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    const token = m[0]
    if (token.startsWith('[')) {
      const [, label, href] = LINK_RE.exec(token) ?? [token, token, '']
      out.push(isSafeUrl(href) ? { kind: 'link', text: label, href } : { kind: 'text', text: label })
    } else if (token.startsWith('**') || token.startsWith('__')) {
      out.push({ kind: 'bold', text: token.slice(2, -2) })
    } else if (token.startsWith('`')) {
      out.push({ kind: 'code', text: token.slice(1, -1) })
    } else {
      out.push({ kind: 'italic', text: token.slice(1, -1) })
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

/** A reply as the plain words a screen reader should announce. */
export function plainText(text: string): string {
  return parseBlocks(text)
    .flatMap((b) => (b.kind === 'p' ? [b.text] : b.kind === 'ul' ? b.items : []))
    .map((line) => parseInline(line).map((r) => r.text).join(''))
    .join(' ')
}

/**
 * A reply as text to paste elsewhere: paragraphs and `- ` bullets, each link
 * as its label and its address, made absolute against `origin`, since a site
 * path means nothing once it leaves the site. Cards and the form are left out.
 */
export function copyText(text: string, origin: string): string {
  const line = (s: string) =>
    parseInline(s)
      .map((r) => (r.kind === 'link' ? `${r.text} (${r.href.startsWith('/') || r.href.startsWith('#') ? new URL(r.href, origin).href : r.href})` : r.text))
      .join('')
  return parseBlocks(text)
    .flatMap((b) => (b.kind === 'p' ? [line(b.text)] : b.kind === 'ul' ? [b.items.map((i) => `- ${line(i)}`).join('\n')] : []))
    .join('\n\n')
}

/**
 * What the in-chat form's message starts with: the visitor's own questions
 * (the last five, each cut short), so Justine sees what they wanted to know.
 */
export function leadDraft(questions: string[], intro: string): string {
  if (!questions.length) return ''
  const cut = (q: string) => (q.length > 200 ? `${q.slice(0, 199).trimEnd()}…` : q)
  return `${intro}\n${questions.slice(-5).map((q) => `- ${cut(q.replace(/\s+/g, ' '))}`).join('\n')}\n\n`
}
