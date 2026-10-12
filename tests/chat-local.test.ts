import { describe, expect, it } from 'vitest'
import { FALLBACK, localAnswer } from '@/lib/chat/local'
import { ALL_SUGGESTIONS, STARTER_SUGGESTIONS, suggestionsFor } from '@/lib/chat/suggestions'
import { SAMPLE_PROJECTS } from '@/lib/chat/samples'
import { profile } from '@/data/profile'
import { assistantFacts } from '@/data/assistantFacts'
import { FAQS } from '@/data/faqs'
import { EXPERIMENTAL } from '@/data/stack'
import { pageFor } from '@/lib/chat/pages'

describe("Lumen's offline rules", () => {
  it('answers every suggestion chip with a real rule, never the fallback', () => {
    for (const chip of ALL_SUGGESTIONS) expect(localAnswer(chip), chip).not.toBe(FALLBACK)
  })

  it('answers "Tell me about <sample>" with that sample, a link to its case study and its card', () => {
    for (const p of SAMPLE_PROJECTS) {
      const reply = localAnswer(`Tell me about ${p.name}`)
      expect(reply).toContain(`**${p.name}**`)
      expect(reply).toContain(`(${p.href})`)
      expect(reply.trim().endsWith(`[[project:${p.key}]]`)).toBe(true)
    }
  })

  it('calls the samples samples, never clients', () => {
    for (const q of ['Show me the projects', 'Tell me about Ostler', 'Any AI agent builds?']) {
      const reply = localAnswer(q)
      expect(reply).toMatch(/sample|fictional/i)
      expect(reply).not.toMatch(/\bclients?\b/i)
    }
  })

  it('offers the in-chat form only on hiring intent, as the last line', () => {
    for (const q of ['How do I get in touch?', 'Is he taking new work?', 'Can I hire him?']) expect(localAnswer(q).trim().endsWith('[[lead-form]]'), q).toBe(true)
    for (const q of ["What's the tech stack?", 'Show me the projects', 'hey', 'What does it cost?']) expect(localAnswer(q), q).not.toContain('[[lead-form]]')
  })

  it('answers the price question with how billing works, and no figure', () => {
    const reply = localAnswer('What does it cost?')
    expect(reply).toContain(assistantFacts.billing)
    expect(reply).not.toMatch(/[$€£]\s?\d|\d+\s?(usd|php|per hour|\/h)/i)
  })

  it('keeps the narrow rules ahead of the broad ones that would shadow them', () => {
    expect(localAnswer('What languages does he speak?')).toBe(`He speaks ${assistantFacts.personal.languages.join(' and ')}.`)
    expect(localAnswer('Strongest part of the stack?')).toContain(FAQS[0].a)
    expect(localAnswer('How does he communicate?')).toContain(assistantFacts.communication)
    expect(localAnswer('What does Justine do?')).toContain(`**${profile.name}**`)
  })

  it('never shows an email address', () => {
    for (const q of [...ALL_SUGGESTIONS, 'What is his email?', 'How can I contact Justine?']) expect(localAnswer(q), q).not.toContain('@')
  })

  it('answers "this page" from the page the visitor has open, and asks which one without it', () => {
    const services = pageFor('/services')!
    expect(localAnswer("What's on this page?", services)).toContain(`**${services.name}**`)
    expect(localAnswer('Tell me about this one', pageFor('/projects#build-plan'))).toContain('build plan')
    expect(localAnswer("What's on this page?")).toMatch(/Which page do you mean?/)
  })

  it('answers whether he uses a tool by name, still-testing tools included, and never takes "make" for Make', () => {
    expect(localAnswer('Does he use Supabase?')).toMatch(/^Yes, \*\*Supabase\*\*/)
    expect(localAnswer('Any experience with postgres?')).toContain('**PostgreSQL**')
    expect(localAnswer('Is he familiar with GitHub Actions?')).toContain('**GitHub Actions**')
    for (const name of EXPERIMENTAL) expect(localAnswer(`Does he use ${name}?`), name).toContain('still testing')
    expect(localAnswer('Can he make a website for me?')).not.toContain('**Make**')
  })

  it('names the one service a question asks for, but leaves price and hiring to their own rules', () => {
    expect(localAnswer('Do you do SEO?')).toContain('**SEO & Performance**')
    expect(localAnswer('Can he build a CRM?')).toContain('**CRM, CMS & Internal Tools**')
    expect(localAnswer('API integrations?')).toContain('**APIs & Integrations**')
    expect(localAnswer('How much is a website?')).toContain(assistantFacts.billing)
    expect(localAnswer('Can I hire him for SEO?').trim().endsWith('[[lead-form]]')).toBe(true)
  })

  it('answers reply speed, timelines, references and why him', () => {
    expect(localAnswer('How fast does he reply?')).toContain(assistantFacts.reply)
    expect(localAnswer('How long does a build take?')).toContain(assistantFacts.start)
    expect(localAnswer('How long has he been coding?')).not.toContain(assistantFacts.start)
    expect(localAnswer('Do you have client references?')).toMatch(/sample systems for fictional businesses/)
    expect(localAnswer('Why work with Justine?')).toContain(assistantFacts.summary)
  })

  it('falls back when nothing matches, and on an empty question', () => {
    expect(localAnswer('Recommend me a good pizza topping')).toBe(FALLBACK)
    expect(localAnswer('   ')).toBe(FALLBACK)
  })

  it('answers "how does a project start?" with the process, not the samples', () => {
    expect(localAnswer('How does a project start?')).toMatch(/Every project goes through the same five steps/)
  })

  it('never confirms work on a product the site does not show, and offers no form for it', () => {
    const reply = localAnswer("Did you build Airbnb's booking system?")
    expect(reply).toMatch(/Nothing on this site mentions that one/)
    expect(reply).not.toContain('[[lead-form]]')
    // A bare "booking" is a system, not hiring intent.
    expect(localAnswer('did you build airbnb booking')).not.toContain('[[lead-form]]')
    // Its own samples, tools and the start of a sentence are not someone else's product.
    expect(localAnswer('Did he build Ostler?')).not.toMatch(/Nothing on this site mentions that one/)
    expect(localAnswer('Did he work on any AI agents?')).not.toMatch(/Nothing on this site mentions that one/)
    expect(localAnswer('I run a clinic. Have you built anything like that?')).not.toMatch(/Nothing on this site mentions that one/)
  })

  it('promises no business results, but still answers a price question as one', () => {
    expect(localAnswer('Can you guarantee my sales double?')).toMatch(/no one can promise results like that/)
    expect(localAnswer('Can I get a guaranteed price?')).toContain(assistantFacts.billing)
  })

  it("matches a visitor's business to its sample, the closest one, or says there is none", () => {
    expect(localAnswer('Did he build anything for a barbershop?')).toMatch(/^\*\*Ostler\*\* is one of \w+'s sample systems/)
    const dental = localAnswer('I run a dental clinic. Have you built anything like that?')
    expect(dental).toMatch(/There isn't a sample for that exact kind of business yet, but the closest is \*\*Range Physical Therapy\*\*/)
    expect(dental.trim().endsWith('[[project:range-physical-therapy]]')).toBe(true)
    expect(localAnswer('We own a gym. Any examples?')).toContain('**Altitude**')
    // "company" alone is too general to make a software company the moving company.
    const software = localAnswer('I run a software company, built anything similar?')
    expect(software).toMatch(/There isn't a sample for that exact kind of business yet./)
    expect(software).not.toContain('[[project:')
  })

  it('turns down off-topic requests in its own words, and keeps "I don\'t have that detail" for unknown facts', () => {
    for (const q of ['Write me a poem about the sea.', "What's the weather in Manila?", 'Tell me a joke']) expect(localAnswer(q), q).toMatch(/that one's outside what I know/)
    expect(localAnswer("What's his story?")).toContain(`**${profile.name}**`)
  })

  it('answers a follow-up from the question before it, and never shadows a chip with one', () => {
    expect(localAnswer('What would that look like?', null, 'I need my lead intake automated.')).toContain('(/automations.html)')
    expect(localAnswer('Tell me more', null, 'Can you build a RAG chatbot for my docs?')).toContain('(/ai-agents.html)')
    expect(localAnswer('Any examples?', null, 'Tell me about Ostler')).toContain('[[project:ostler-barbers]]')
    expect(localAnswer('What would that look like?', null, 'hey')).toBe(FALLBACK)
    for (const chip of ALL_SUGGESTIONS) expect(localAnswer(chip, null, 'Can you build a RAG chatbot?'), chip).toBe(localAnswer(chip))
  })

  it('takes "is he taking on new clients?" as hiring intent, not a projects question', () => {
    expect(localAnswer('Is he taking on new clients?').trim().endsWith('[[lead-form]]')).toBe(true)
    expect(localAnswer('Is he booking new projects?').trim().endsWith('[[lead-form]]')).toBe(true)
  })
})

describe('suggestion chips', () => {
  it('starts with four chips, and picks three after a reply from the question first', () => {
    expect(STARTER_SUGGESTIONS).toHaveLength(4)
    expect(suggestionsFor('Here are some samples.', 'What does it cost?')).toEqual(['How does he work?', 'Who owns the code?', 'Show me the projects'])
    expect(suggestionsFor(null, null)).toHaveLength(3)
    expect(suggestionsFor(null, 'Tell me about Oriel')).toContain('Any AI agent builds?')
  })

  // Lumen may say "I" about itself ("I don't have that detail"); it never speaks as Justine, the way data/faqs.ts does.
  it('speaks about Justine in the third person, never in his own voice', () => {
    for (const q of [...ALL_SUGGESTIONS, 'Can I hire him?', 'How soon can he start?', 'Do you maintain it?']) {
      expect(localAnswer(q), q).not.toMatch(/\bI (work|read|reply|send|build|can|cannot|hop)\b|\bmy (work|projects|stack)\b/)
    }
  })
})
