import type { Passage } from '@/lib/assistant/passages'

/** BM25's term-frequency saturation and length normalisation. */
const K1 = 1.2
const B = 0.75

/** Words that say nothing about the topic. A word the synonym map uses is never here. */
const STOP = new Set(
  [
    'a an the and or but of to in on at for from with by as is are was were be been am do does did you your yours i me my we our us it its they them this that these those there here',
    'what whats who whom which how can could would should will shall may might please just so very really about tell any some have has had get got hi hello hey thanks thank ok okay',
    'like if then than also into need needed want wanted help going go done know actually im ive id youre',
  ]
    .join(' ')
    .split(' '),
)

/**
 * Groups of words that mean about the same (§4.2's, plus the ones the questions in §7 and the final review need). Every word in a group stands for
 * every other, so "rate" reaches "charge" as well as "price". A phrase counts as its words, the stop words dropped.
 */
const SYNONYM_GROUPS: string[][] = [
  ['price', 'cost', 'charge', 'rate', 'budget'],
  ['hire', 'work with'],
  ['start', 'begin', 'available'],
  ['build', 'make', 'develop'],
  ['chatbot', 'bot', 'chat', 'rag', 'retrieval', 'agent'],
  ['automation', 'workflow', 'n8n', 'zapier'],
  ['maintain', 'support', 'maintenance'],
  ['where', 'based', 'location'],
  ['write', 'send', 'message'],
  ['website', 'web', 'saas'],
  ['connect', 'integration', 'integrate'],
  ['method', 'process'],
  ['portfolio', 'project'],
  ['service', 'offer'],
]

/**
 * Questions whose meaning lives in their stop words ("who are you", "how do you work") or in a set phrase ("tech stack"): each pattern, matched on the
 * lowercased question, is replaced by the word that names its topic before the question is split into words. The topic word is what the answering passage says.
 */
const TOPICS: [RegExp, string][] = [
  // A stack that is not "full stack" is the tools Justine works with.
  [/(?<!\bfull )\b(?:(?:tech|technology|software) )?stack\b/g, 'stack tools'],
  [/\bhow (?:(?:do|does|did|will|would) )?(?:you|justine|kraft|she|he|they) works?\b/g, 'method'],
  [/\bwho (?:are|is) (?:you|justine|kraft)\b/g, 'justine'],
  [/\babout (?:you|yourself|justine|kraft)\b/g, 'justine'],
  [/\bwhat (?:do|does) (?:you|justine|kraft) do\b/g, 'justine'],
  [/\b(?:justines|krafts|your) work\b/g, 'portfolio'],
  [/^ *about *$/g, 'justine'],
]

/**
 * A word without its ending (-ing, -ed, -es, -s), when 3 or more letters are left, and without a final -e, so site and sites, price and pricing agree.
 * A final -s after another s stays ("process"), and -ation becomes -at, so automation meets automate.
 */
const stem = (w: string) => {
  for (const end of ['ing', 'ed', 'es', 's']) {
    if (w.endsWith(end) && w.length - end.length >= 3 && !(end === 's' && w.endsWith('ss'))) {
      w = w.slice(0, -end.length)
      break
    }
  }
  if (w.endsWith('ation') && w.length > 7) return w.slice(0, -3)
  return w.length > 3 && w.endsWith('e') ? w.slice(0, -1) : w
}

/** Lowercased words with the apostrophes closed up and the stop words dropped, each stemmed. */
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem)

/** A question's words, after its stop-word topics ("who are you") are named. */
const queryTokens = (s: string) => {
  let said = ` ${s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `
  for (const [pattern, topic] of TOPICS) said = said.replace(pattern, ` ${topic} `)
  return tokens(said)
}

/** Whether a message says nothing beyond stop words (and the words in `also`): "thanks, that helps" past its thanks. */
export const onlyStopWords = (s: string, also: string[] = []) => {
  const skip = new Set(also.map(stem))
  return tokens(s).every((w) => STOP.has(w) || skip.has(w))
}

/** Each word, and the words it stands for. */
const SYNONYMS = new Map<string, Set<string>>()
for (const group of SYNONYM_GROUPS) {
  const words = group.flatMap(tokens)
  for (const a of words) for (const b of words) if (a !== b) SYNONYMS.set(a, (SYNONYMS.get(a) ?? new Set()).add(b))
}

type Index = { docs: Map<string, number>[]; lengths: number[]; avg: number; df: Map<string, number>; titles: Set<string>[] }

const indexes = new WeakMap<Passage[], Index>()

/**
 * What BM25 needs about a set of passages: each one's word counts (the title twice, the text once unless the passage is `titleOnly`), its length,
 * and each word's document frequency; and each title's words.
 */
function indexOf(passages: Passage[]): Index {
  let ix = indexes.get(passages)
  if (ix) return ix
  const docs = passages.map((p) => {
    const counts = new Map<string, number>()
    for (const t of [...tokens(p.title), ...tokens(p.title), ...(p.titleOnly ? [] : tokens(p.text))]) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  })
  const lengths = docs.map((d) => [...d.values()].reduce((n, c) => n + c, 0))
  const df = new Map<string, number>()
  for (const d of docs) for (const t of d.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  ix = { docs, lengths, avg: lengths.reduce((n, l) => n + l, 0) / Math.max(1, lengths.length), df, titles: passages.map((p) => new Set(tokens(p.title))) }
  indexes.set(passages, ix)
  return ix
}

/** How much more a passage counts when the question is its title, word for word once the stop words are gone ("what do you build" and "What do you actually build?"). */
const TITLE_MATCH = 2

/** Whether the question's words are exactly the title's. */
const asksTitle = (own: string[], title: Set<string>) => own.length === title.size && own.every((t) => title.has(t))

/**
 * The lowest score a passage may have to count as an answer, tuned against real scores, about halfway between them: a question that shares only one
 * incidental word with the site ("how long does a project take" 2.18, "do you work weekends" 1.33) falls below it, and the weakest must-land answer
 * ("do you have a portfolio" 3.27) clears it. A question with no word in common scores 0 whatever the threshold.
 */
export const MIN_SCORE = 2.7

/**
 * Every passage that shares a word with `query`, best first, with its score: BM25 over title ×2 and text, the query widened by synonyms, times the share
 * of the query's words that the site uses at all (so "how long does a project take", two of whose three words the site never says, counts for a third).
 * Deterministic. searchPassages is this, cut at MIN_SCORE.
 */
export function rankPassages(query: string, passages: Passage[]): { passage: Passage; score: number }[] {
  const own = [...new Set(queryTokens(query))]
  if (!own.length) return []
  const { docs, lengths, avg, df, titles } = indexOf(passages)
  const widen = (t: string) => [t, ...(SYNONYMS.get(t) ?? [])]
  const terms = new Set(own.flatMap(widen))
  const known = own.filter((t) => widen(t).some((w) => df.has(w))).length / own.length

  const n = passages.length
  const hits: { passage: Passage; score: number; at: number }[] = []
  docs.forEach((d, at) => {
    let score = 0
    for (const t of terms) {
      const tf = d.get(t)
      if (!tf) continue
      const f = df.get(t)!
      const idf = Math.log(1 + (n - f + 0.5) / (f + 0.5))
      score += idf * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * lengths[at]) / avg)))
    }
    score *= (passages[at].weight ?? 1) * known * (asksTitle(own, titles[at]) ? TITLE_MATCH : 1)
    if (score > 0) hits.push({ passage: passages[at], score, at })
  })
  return hits.sort((a, b) => b.score - a.score || a.at - b.at).map(({ passage, score }) => ({ passage, score }))
}

/** The passages that answer `query`, best first, each scoring at least MIN_SCORE (see rankPassages). Deterministic. */
export function searchPassages(query: string, passages: Passage[]): { passage: Passage; score: number }[] {
  return rankPassages(query, passages).filter((h) => h.score >= MIN_SCORE)
}
