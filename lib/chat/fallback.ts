import { chat } from '@/data/chat'
import { FAQS } from '@/data/faqs'
import { PROCESS, SERVICES } from '@/data/services'
import { TOOLS } from '@/data/stack'
import { CERTS } from '@/data/credentials'
import { about } from '@/data/about'
import { CASES } from '@/data/cases'
import { casePath } from '@/data/cases/pages'
import { MARKER } from '@/lib/chat/reply'

/**
 * The chat's answers without Claude (spec 2026-10-12 chat fallback): the
 * visitor's question is scored against a small table of topics by trigger
 * words, and the winning topic answers with the site's own text and a link.
 * Used when no key is set, and when a Claude call fails before its first word.
 */

const F = chat.fallback

/** The text as matching sees it: lowercase letters and digits, one space apart. */
export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

/** How many of `triggers` appear in the normalised question, each as a whole word or phrase. */
const score = (q: string, triggers: string[]) => triggers.filter((t) => ` ${q} `.includes(` ${normalise(t)} `)).length

const link = (label: string, path: string) => `[${label}](${path})`
const list = (intro: string, items: string[]) => [intro, ...items.map((item) => `- ${item}`)].join('\n')
const withLink = (text: string, label: string, path: string) => `${text}\n\n${link(label, path)}`

/** Each tool's name as a visitor might type it: "next js", and "nextjs" too. */
const TOOL_WORDS = TOOLS.flatMap(({ name }) => {
  const words = normalise(name)
  const joined = words.replace(/ /g, '')
  return joined === words ? [words] : [words, joined]
})

/** Each case with the words that point at it: its name and trade, less the general ones, plus its everyday words. */
const CASE_WORDS = Object.entries(CASES).map(([key, set]) => {
  const business = set.agents?.builds[0]?.business ?? { name: key, trade: key }
  const own = normalise(`${business.name} ${business.trade}`)
    .split(' ')
    .filter((w) => w.length >= 4 && !F.caseStop.includes(w))
  return { key, set, business, words: [...new Set([...own, ...(F.caseWords[key] ?? [])])] }
})

type Case = (typeof CASE_WORDS)[number]

const businesses = (cases: Case[]) =>
  withLink(list(F.intro.cases, cases.map(({ business }) => `${business.name} (${business.trade})`)), F.links.projects, '/projects')

/** One case: the names of its agents and flows only, so the reply stays short; the case page has the detail. */
function caseReply(c: Case) {
  const items = [...(c.set.agents?.builds.map((b) => b.name) ?? []), ...(c.set.automation?.flows.map((f) => f.title) ?? [])]
  return withLink(list(`${F.intro.case} ${c.business.name} (${c.business.trade}):`, items), F.links.case, casePath(c.key, 'ai-agents.html'))
}

/** The case studies topic: one case when exactly one fits best, else the businesses that tie, else all of them. */
function cases(q: string) {
  const scored = CASE_WORDS.map((c) => ({ c, n: score(q, c.words) }))
  const best = Math.max(...scored.map((s) => s.n))
  const top = scored.filter((s) => s.n === best).map((s) => s.c)
  const reply = best === 0 ? businesses(CASE_WORDS) : top.length === 1 ? caseReply(top[0]) : businesses(top)
  return { n: score(q, F.triggers.cases) + best, reply }
}

const faq = (i: number) => withLink(FAQS[i].a, F.links.contact, '/contact')

/** The topics in tie-break order: each scores the question and, if it wins, writes the reply. */
const TOPICS: ((q: string) => { n: number; reply: string })[] = [
  (q) => ({ n: score(q, F.triggers.price), reply: faq(2) }),
  (q) => ({ n: score(q, F.triggers.start), reply: faq(1) }),
  (q) => ({ n: score(q, F.triggers.after), reply: faq(3) }),
  (q) => ({ n: score(q, F.triggers.maintain), reply: faq(4) }),
  cases,
  (q) => ({
    n: score(q, F.triggers.process),
    reply: withLink(list(F.intro.process, PROCESS.map((s) => `${s.name}: ${s.line}`)), F.links.services, '/services'),
  }),
  (q) => ({
    n: score(q, F.triggers.services),
    reply: withLink(list(F.intro.services, SERVICES.map((s) => `${s.name}: ${s.line}`)), F.links.services, '/services'),
  }),
  (q) => ({ n: score(q, F.triggers.build), reply: withLink(FAQS[0].a, F.links.services, '/services') }),
  (q) => ({
    n: score(q, [...F.triggers.stack, ...TOOL_WORDS]),
    reply: withLink(`${F.intro.stack}\n${TOOLS.map((t) => t.name).join(', ')}`, F.links.about, '/about'),
  }),
  (q) => ({ n: score(q, F.triggers.courses), reply: withLink(list(F.intro.courses, CERTS.map((c) => c.name)), F.links.about, '/about') }),
  (q) => ({ n: score(q, F.triggers.about), reply: withLink(`${F.intro.about}\n${about.description}\n${about.location.title}.`, F.links.about, '/about') }),
  (q) => ({ n: score(q, F.triggers.hello), reply: F.hello }),
]

/** The fallback's answer to a visitor's question: the best topic's reply, with the hand-off when they sound ready to hire. */
export function fallbackReply(question: string): string {
  const q = normalise(question)
  let winner: { n: number; reply: string } = { n: 0, reply: '' }
  for (const topic of TOPICS) {
    const result = topic(q)
    if (result.n > winner.n) winner = result
  }
  if (winner.n === 0) return `${F.unknown}\n${MARKER}`
  return score(q, F.buying) > 0 ? `${winner.reply}\n${MARKER}` : winner.reply
}
