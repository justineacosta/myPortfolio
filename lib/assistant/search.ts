import type { Passage } from '@/lib/assistant/passages'

/** BM25's term-frequency saturation and length normalisation. */
const K1 = 1.2
const B = 0.75

/** Words that say nothing about the topic. A word the synonym map uses is never here. */
const STOP = new Set(
  [
    'a an the and or but of to in on at for from with by as is are was were be been am do does did you your yours i me my we our us it its they them this that these those there here',
    'what whats who whom which how can could would should will shall may might please just so very really about tell any some have has had get got hi hello hey thanks thank ok okay',
    'like if then than also into need needed want wanted help going go',
  ]
    .join(' ')
    .split(' '),
)

/** Pairs of words that mean about the same, each way (§4.2's, plus rag, write, website and connect, which the questions in §7 need). A phrase counts as its words, the stop words dropped. */
const SYNONYM_PAIRS: [string, string[]][] = [
  ['price', ['cost', 'charge', 'rate', 'budget']],
  ['hire', ['work with']],
  ['start', ['begin', 'available']],
  ['build', ['make', 'develop']],
  ['chatbot', ['bot', 'chat', 'RAG']],
  ['rag', ['retrieval']],
  ['automation', ['workflow', 'n8n', 'zapier', 'make']],
  ['maintain', ['support', 'maintenance']],
  ['where', ['based', 'location']],
  ['write', ['send', 'message']],
  ['website', ['web', 'saas']],
  ['connect', ['integration', 'integrate']],
]

/** A word without its ending (-ing, -ed, -es, -s), when 3 or more letters are left, and without a final -e, so site and sites, price and pricing agree. */
const stem = (w: string) => {
  for (const end of ['ing', 'ed', 'es', 's']) {
    if (w.endsWith(end) && w.length - end.length >= 3) {
      w = w.slice(0, -end.length)
      break
    }
  }
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

/** Each word, and the words it stands for. */
const SYNONYMS = new Map<string, Set<string>>()
const link = (from: string, to: string) => {
  if (from !== to) SYNONYMS.set(from, (SYNONYMS.get(from) ?? new Set()).add(to))
}
for (const [word, others] of SYNONYM_PAIRS) {
  for (const a of tokens(word)) {
    for (const b of others.flatMap(tokens)) {
      link(a, b)
      link(b, a)
    }
  }
}

type Index = { docs: Map<string, number>[]; lengths: number[]; avg: number; df: Map<string, number> }

const indexes = new WeakMap<Passage[], Index>()

/** What BM25 needs about a set of passages: each one's word counts (the title twice, the text once), its length, and each word's document frequency. */
function indexOf(passages: Passage[]): Index {
  let ix = indexes.get(passages)
  if (ix) return ix
  const docs = passages.map((p) => {
    const counts = new Map<string, number>()
    for (const t of [...tokens(p.title), ...tokens(p.title), ...tokens(p.text)]) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  })
  const lengths = docs.map((d) => [...d.values()].reduce((n, c) => n + c, 0))
  const df = new Map<string, number>()
  for (const d of docs) for (const t of d.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  ix = { docs, lengths, avg: lengths.reduce((n, l) => n + l, 0) / Math.max(1, lengths.length), df }
  indexes.set(passages, ix)
  return ix
}

/**
 * The lowest score a passage may have to count as an answer, tuned against real scores: a question that shares only one incidental word with the site
 * ("do you work weekends" 2.7, "how long does a project take" 2.1, "do you have a portfolio" 1.1) falls below it, and the weakest must-land answer (3.2) clears it.
 * A question with no word in common scores 0 whatever the threshold.
 */
export const MIN_SCORE = 3

/** The passages that answer `query`, best first, each scoring at least MIN_SCORE (BM25 over title ×2 and text, the query widened by synonyms). Deterministic. */
export function searchPassages(query: string, passages: Passage[]): { passage: Passage; score: number }[] {
  const terms = new Set(tokens(query))
  for (const t of [...terms]) for (const s of SYNONYMS.get(t) ?? []) terms.add(s)
  if (!terms.size) return []

  const { docs, lengths, avg, df } = indexOf(passages)
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
    score *= passages[at].weight ?? 1
    if (score >= MIN_SCORE) hits.push({ passage: passages[at], score, at })
  })
  return hits.sort((a, b) => b.score - a.score || a.at - b.at).map(({ passage, score }) => ({ passage, score }))
}
