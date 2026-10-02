import { assistant } from '@/data/assistant'
import { commands } from '@/lib/commands'
import type { AssistantEvent } from '@/lib/assistant/events'
import type { ChatMessage } from '@/lib/assistant/limits'
import { sitePassages, type Passage } from '@/lib/assistant/passages'
import { onlyStopWords, searchPassages } from '@/lib/assistant/search'
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
/**
 * Phrases that mean the visitor wants Justine's help or to reach Justine (spec §4 rule 3, and the panel's own "leave Justine a message").
 * Calls and meetings are phrases, not words, so "What do you call your process?" and "Do you meet deadlines?" stay questions.
 */
const LEAD = [
  'hire', 'work with', 'work together', 'quote', 'estimate', 'project in mind', 'book',
  'a call', 'call me', 'book a call', 'schedule a call', 'meet with', 'a meeting', 'set up a meeting',
  'leave a message', 'leave justine a message', 'send a message', 'message justine', 'email justine',
  'talk to', 'speak to', 'reach', 'contact', 'in touch', 'get in touch',
]
/** Words that open a greeting (spec §4 rule 1). */
const HELLO = ['hi', 'hello', 'hey', 'ok', 'okay', 'cool', 'good morning', 'good afternoon', 'good evening']
/** Words that open a thanks (spec §4 rule 1). */
const THANKS = ['thanks', 'thank you', 'thank', 'cheers']
/** Words a greeting or thanks may carry besides the stop words: "hi there", "thanks Justine", "thanks so much, that’s helpful". */
const COURTESY = ['there', 'justine', 'kraft', 'much', 'lot', 'great', 'helpful', 'again']
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

/**
 * Whether the whole message is a thanks or a greeting (spec §4 rule 1), and which: it has one of their words, and nothing else but stop words
 * and courtesies ("hi there", "good morning, Justine", "thanks, that helps"). A thanks wins over a greeting ("hi, thanks").
 */
function courtesy(said: string): 'thanks' | 'hello' | null {
  const thanks = THANKS.some((t) => has(said, t))
  if (!thanks && !HELLO.some((h) => has(said, h))) return null
  let rest = said
  for (const phrase of [...THANKS, ...HELLO].sort((a, b) => b.length - a.length)) rest = rest.split(norm(phrase)).join(' ')
  if (!onlyStopWords(rest, COURTESY)) return null
  return thanks ? 'thanks' : 'hello'
}

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
  // The runner-up is named by its own title: its page's label ("FAQs / Contact") says nothing about what it answers.
  if (next && next.score >= ALSO_RATIO * best.score && pageOf(next.passage.href) !== pageOf(p.href)) out += `\n${q.also} [${next.passage.title}](${next.passage.href})`
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

  const kind = courtesy(said)
  if (kind) return reply(kind === 'thanks' ? q.thanks : q.hello)

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
