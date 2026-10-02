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

  // The final review's answer-quality list, the panel's chips and the topics its greeting, hello and no-match lines suggest.
  it.each([
    ['What are your rates?', 'faq-3'],
    // The billing fact (hourly or fixed) answers this better than the pricing FAQ, now that the assistant knows it.
    ['what is your hourly rate', 'billing'],
    ['How much does a website cost?', 'faq-3'],
    ['whats your budget range', 'faq-3'],
    ['Can you make me a chatbot for my website?', 'service-2'],
    ['Can you automate my invoices?', 'service-3'],
    ['what is your process', 'method'],
    ['how do you work', 'method'],
    ['how does Justine work', 'method'],
    ['how Justine works', 'method'],
    ['process', 'method'],
    ['What do you call your process?', 'method'],
    ['What services do you offer?', 'services-overview'],
    ['services', 'services-overview'],
    ['what are your services', 'services-overview'],
    ['what projects have you done', 'projects-overview'],
    ['projects', 'projects-overview'],
    ['do you have a portfolio', 'projects-overview'],
    ['Justine’s work', 'projects-overview'],
    ['Who is Justine?', 'about-overview'],
    ['who are you', 'about-overview'],
    ['tell me about yourself', 'about-overview'],
    ['What do you do?', 'about-overview'],
    ['about', 'about-overview'],
    ['What is your tech stack?', 'stack'],
    ['what is the build plan', 'card-plan'],
    ['What do you build?', 'faq-1'],
  ])('answers “%s” with the passage %s', (q, id) => {
    expect(top(q)?.id).toBe(id)
  })

  // Facts the assistant knows beyond the site's pages (data/assistantFacts.ts).
  it.each([
    ['where did you study', 'education'],
    ['what is your degree', 'education'],
    ['what is your work experience', 'career'],
    ['where have you worked before', 'career'],
    ['what languages do you speak', 'background'],
    ['do you speak Filipino', 'background'],
    ['what do you do for fun', 'interests'],
    ['what are your hobbies', 'interests'],
    ['who owns the code', 'ownership'],
    ['do you charge hourly or a fixed price', 'billing'],
    ['can you join our existing team', 'team'],
    ['do you also design', 'design'],
    ['how do you communicate with clients', 'communication'],
    ['what is your philosophy', 'beliefs'],
  ])('answers “%s” with the fact %s', (q, id) => {
    expect(top(q)?.id).toBe(id)
  })

  it('answers “Do you know React?” with a passage that names React', () => {
    const hit = top('Do you know React?')!
    expect(hit.text).toContain('React')
    expect(['stack', 'service-1']).toContain(hit.id)
  })

  it('leads “How much does a website cost?” with the pricing FAQ, not the web service', () => {
    const [first, second] = searchPassages('How much does a website cost?', p)
    expect(first.passage.title).toBe('How much do you charge?')
    expect(second?.passage.id).not.toBe('faq-3')
  })

  it('links every word of a synonym group to every other', () => {
    for (const q of ['charge', 'rate', 'budget', 'cost', 'price']) expect(top(`what do you ${q}`)?.id, q).toBe('faq-3')
  })

  it('stems automate, automated, automating and automation alike, and keeps a final -ss', () => {
    for (const q of ['automate', 'automated', 'automating', 'automation']) expect(top(`do you do ${q}`)?.id, q).toBe('service-3')
    expect(top('what is your process')?.id).toBe('method')
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
  // “do you have a portfolio” was here until the final review ruled it must land on the Projects overview (above).
  it.each(['do you work weekends', 'how long does a project take', 'do you work on weekends', 'how long will my project take'])('finds nothing for “%s”, whose only overlap is incidental', (q) => {
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
