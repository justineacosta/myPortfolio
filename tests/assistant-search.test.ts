import { describe, expect, it } from 'vitest'
import { buildPassages } from '@/lib/assistant/passages'
import { MIN_SCORE, searchPassages } from '@/lib/assistant/search'

const p = buildPassages()
const top = (q: string) => searchPassages(q, p)[0]?.passage

describe('searchPassages', () => {
  it.each([
    ['what do you charge', 'How much do you charge?'],
    ['how fast can you start', 'How fast can you start?'],
    ['do you maintain what you build', 'Do you maintain what you build?'],
    ['what happens after I send a message', 'What happens after I write?'],
    ['what do you build', 'What do you actually build?'],
    ['do you use n8n', 'Automation & Workflows'],
    ['can you build a RAG chatbot', 'AI Agents & RAG'],
    ['I need a CRM', 'CRM, CMS & Internal Tools'],
    ['do you build websites', 'Full-Stack Web & SaaS'],
    ['can you connect my APIs', 'APIs & Integrations'],
    ['tell me about your agentic framework', 'The Agentic Framework'],
  ])('answers “%s” with “%s”', (q, title) => {
    expect(top(q)!.title).toBe(title)
  })

  it('answers “where are you based” with the About location', () => {
    const hit = top('where are you based')!
    expect(hit.href).toBe('/about')
    expect(hit.title).toMatch(/Manila/)
  })

  it('answers “what is the Kraft method” with the method passage', () => {
    const hit = top('what is the Kraft method')!
    expect(hit.id).toBe('method')
    expect(hit.href).toBe('/services#method')
  })

  it('answers “what tools do you use” with the stack', () => {
    expect(top('what tools do you use')!.id).toBe('stack')
  })

  it.each([
    'what’s the weather today',
    'what\'s the weather today',
    'tell me a joke',
    'who won the game',
    'do you like pizza',
    'what\'s your favourite movie',
    'can you help me with my homework',
    'is it going to rain',
    'what if I need help',
  ])('finds nothing for “%s”', (q) => {
    expect(searchPassages(q, p)).toEqual([])
  })

  // These share one common word with the site, so they score above 0: only MIN_SCORE keeps them out.
  it.each(['do you work weekends', 'how long does a project take', 'do you have a portfolio'])('finds nothing for “%s”, whose only overlap is incidental', (q) => {
    expect(searchPassages(q, p)).toEqual([])
  })

  it('returns hits best first, all at or above MIN_SCORE', () => {
    const hits = searchPassages('what do you charge', p)
    expect(hits.length).toBeGreaterThan(0)
    for (const h of hits) expect(h.score).toBeGreaterThanOrEqual(MIN_SCORE)
    for (let i = 1; i < hits.length; i++) expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score)
  })

  it('ignores case and punctuation', () => {
    expect(top('WHAT DO YOU CHARGE???')).toEqual(top('what do you charge'))
  })

  it('finds nothing for an empty query', () => {
    expect(searchPassages('', p)).toEqual([])
    expect(searchPassages('  ?! ', p)).toEqual([])
  })

  it('gives the same result for the same query', () => {
    expect(searchPassages('how much for a website', p)).toEqual(searchPassages('how much for a website', p))
  })
})
