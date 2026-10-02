import { assistant } from '@/data/assistant'
import { commands } from '@/lib/commands'
import type { AssistantEvent } from '@/lib/assistant/events'
import type { ChatMessage } from '@/lib/assistant/limits'
import { sitePassages, type Passage } from '@/lib/assistant/passages'
import { searchPassages } from '@/lib/assistant/search'
import type { TurnRecord } from '@/lib/assistant/turn'

const q = assistant.quick

/** The longest a passage's text may run in an answer, in characters (spec §4 rule 4). */
const MAX_BODY = 400
/** How close to the best score the runner-up must be to get an "Also:" line (spec §4 rule 4). */
const ALSO_RATIO = 0.6

/** Phrases that open a request to go somewhere (spec §4 rule 2). The request must start with one, so "are you open to new work" is a question, not a trip. */
const GO = ['take me to', 'show me', 'open', 'go to', 'bring me to']
/** Polite lead-ins that may come before a go-intent ("can you show me your projects"). */
const LEAD_IN = ['please', 'can you', 'could you', 'can i', 'let me', 'i want to', 'id like to']
/** Words that may sit between the go-intent and the name of the page ("show me your projects", "open the bio"). */
const FILLER = ['your', 'the', 'my', 'our', 'a', 'an', 'please']
/** Phrases that mean the visitor wants Justine's help (spec §4 rule 3). */
const LEAD = ['hire', 'work with', 'work together', 'quote', 'estimate', 'project in mind', 'call', 'meet', 'meeting', 'book', 'get in touch', 'contact justine', 'email justine']
/** Words that name a page without using its label (spec §4 rule 2). */
const ALIASES: Record<string, string> = {
  work: '/projects',
  portfolio: '/projects',
  hire: '/contact',
  contact: '/contact',
  message: '/contact',
  prices: '/services',
  services: '/services',
  offers: '/services',
  about: '/about',
  bio: '/about',
  home: '/',
}

/** Lowercase words with the punctuation gone and a space either side, so a whole word or phrase is a plain substring test. */
const norm = (s: string) => ` ${s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `
/** A word without a final -s, so "project" meets "projects". */
const singular = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)
const has = (said: string, phrase: string) => said.includes(norm(phrase))

/** Whether the whole message is a greeting or thanks (spec §4 rule 1). */
const isGreeting = (said: string) => /\b(hi|hello|hey|thanks|thank you|ok|okay|cool)\b/.test(said) && !said.replace(/\b(hi|hello|hey|thanks|thank you|ok|okay|cool)\b/g, '').trim()

/** The words a message asks to be taken to, after its polite lead-ins, its go-intent and the filler words; null when it does not start with a go-intent. */
function destination(said: string): string[] | null {
  let rest = said
  for (let lead = LEAD_IN.find((l) => rest.startsWith(norm(l))); lead; lead = LEAD_IN.find((l) => rest.startsWith(norm(l)))) rest = rest.slice(norm(lead).length - 1)
  const go = GO.find((g) => rest.startsWith(norm(g)))
  if (!go) return null
  const words = rest.slice(norm(go).length).split(' ').filter(Boolean)
  while (words.length && FILLER.includes(words[0])) words.shift()
  return words
}

/** The commands() entry that the words start with, by its label (the word "the" aside) or an alias. The longest name wins, and the first in order on a tie. */
function named(words: string[]) {
  const list = commands()
  const given = words.map(singular)
  let best: { cmd: (typeof list)[number]; length: number } | undefined
  const offer = (cmd: (typeof list)[number], name: string[]) => {
    const own = name.map(singular)
    const length = name.join(' ').length
    if (own.length && own.every((w, i) => w === given[i]) && (!best || length > best.length)) best = { cmd, length }
  }
  for (const cmd of list) offer(cmd, norm(cmd.label).split(' ').filter((w) => w && w !== 'the'))
  for (const [alias, href] of Object.entries(ALIASES)) {
    const cmd = list.find((c) => c.href === href)
    if (cmd) offer(cmd, [alias])
  }
  return best?.cmd
}

/** A passage's text for an answer: whole when it fits, else cut after the last sentence end before MAX_BODY, else at a word with an ellipsis. */
function excerpt(text: string) {
  if (text.length <= MAX_BODY) return text
  let end = 0
  for (const m of text.matchAll(/[.!?](?=\s|$)/g)) if (m.index! < MAX_BODY) end = m.index! + 1
  if (end) return text.slice(0, end)
  let cut = text.slice(0, MAX_BODY)
  if (/\S/.test(text[MAX_BODY])) cut = cut.slice(0, Math.max(cut.lastIndexOf(' '), 0)) || cut
  return `${cut.trimEnd()}…`
}

/** The page a link points at, without its #section. */
const pageOf = (href: string) => href.split('#')[0]

/** A passage as an answer: its title, its text, a link to read more and, when a near-as-good passage sits on another page, a link to that. */
function answer(hits: { passage: Passage; score: number }[]) {
  const [best, next] = hits
  const p = best.passage
  let out = `**${p.title}**\n${excerpt(p.text)}\n${q.more} [${p.label}](${p.href})`
  if (next && next.score >= ALSO_RATIO * best.score && pageOf(next.passage.href) !== pageOf(p.href)) out += `\n${q.also} [${next.passage.label}](${next.passage.href})`
  return out
}

/**
 * The quick engine (spec §4): a reply written from the site's own text, with no AI. It reads only the visitor's last message and tries, in order,
 * a greeting, a trip to a page (only when the message starts by asking for one), a lead, a search of the site's passages and a no-match line. It emits one `text` event holding the whole reply,
 * then any `navigate` and `form` events (a form card is never shown twice in a row, or after a lead). It never emits `done`.
 */
export function quickTurn(opts: { history: ChatMessage[]; formShown: boolean; leadSent: boolean; emit: (e: AssistantEvent) => void; passages?: Passage[] }): TurnRecord {
  const { emit, formShown, leadSent } = opts
  const record: TurnRecord = { text: '', tools: [], usage: { input: 0, output: 0 }, leadSent: false, engine: 'site' }
  const message = [...opts.history].reverse().find((m) => m.role === 'user')?.content ?? ''
  const said = norm(message)
  const form = !formShown && !leadSent
  const reply = (text: string, ...after: AssistantEvent[]) => {
    record.text = text
    emit({ type: 'text', delta: text })
    for (const e of after) emit(e)
    return record
  }

  if (isGreeting(said)) return reply(q.hello)

  const where = destination(said)
  if (where) {
    const cmd = named(where)
    if (cmd) {
      record.tools.push({ name: 'navigate', input: { href: cmd.href }, result: cmd.label, isError: false })
      return reply(`${q.going} ${cmd.label}.`, { type: 'navigate', href: cmd.href, label: cmd.label })
    }
  }

  const hits = searchPassages(message, opts.passages ?? sitePassages())

  if (LEAD.some((l) => has(said, l))) {
    // After a lead there is nothing to fill in, so the ask gives way to the line that says the message is already in.
    const ask = leadSent ? q.form.already : q.leadAsk
    return reply(hits.length ? `${answer(hits)}\n\n${ask}` : ask, ...(form ? [{ type: 'form' as const }] : []))
  }

  if (hits.length) return reply(answer(hits))
  return reply(q.none, ...(form ? [{ type: 'form' as const }] : []))
}
