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
    expect(localAnswer('What languages does he speak?')).toBe(`${assistantFacts.personal.languages.join(' and ')}.`)
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
    expect(localAnswer("What's on this page?")).toMatch(/^Which page/)
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
