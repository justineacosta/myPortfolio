import { describe, expect, it } from 'vitest'
import { chat } from '@/data/chat'
import { FAQS } from '@/data/faqs'
import { PROCESS, SERVICES } from '@/data/services'
import { TOOLS } from '@/data/stack'
import { CERTS } from '@/data/credentials'
import { about } from '@/data/about'
import { CASES } from '@/data/cases'
import { casePath } from '@/data/cases/pages'
import { KNOWN_PATHS } from '@/lib/chat/knowledge'
import { fallbackReply, normalise } from '@/lib/chat/fallback'
import { MAX_LENGTH } from '@/lib/chat/validate'

const ostler = CASES['ostler-barbers'].agents!.builds
const businesses = Object.values(CASES).map((set) => set.agents!.builds[0].business)
const businessOf = (key: string) => CASES[key].agents!.builds[0].business
const asked: string[] = []
/** The reply to `q`, remembered so the link check covers every question these tests ask. */
const reply = (q: string) => {
  asked.push(q)
  return fallbackReply(q)
}

describe('fallbackReply', () => {
  it('answers a price question with the FAQ, a contact link and the hand-off', () => {
    const r = reply('How much do you charge?')
    expect(r).toContain(FAQS[2].a)
    expect(r).toContain('](/contact)')
    expect(r.endsWith('\n[[contact]]')).toBe(true)
  })

  it('answers a start question with the FAQ and no hand-off', () => {
    const r = reply('How fast can you start?')
    expect(r).toContain(FAQS[1].a)
    expect(r).not.toContain('[[contact]]')
  })

  it('answers what happens after writing', () => {
    expect(reply('What happens after I write?')).toContain(FAQS[3].a)
  })

  it('answers a maintenance question', () => {
    expect(reply('Do you maintain it after launch?')).toContain(FAQS[4].a)
  })

  it('lists the process steps with a services link', () => {
    const r = reply('What is your process?')
    for (const step of PROCESS) expect(r).toContain(step.name)
    expect(r).toContain('](/services)')
  })

  it('lists every service with its line', () => {
    const r = reply('Do you do SEO?')
    for (const s of SERVICES) {
      expect(r).toContain(s.name)
      expect(r).toContain(s.line)
    }
  })

  it('answers what he builds with the first FAQ', () => {
    expect(reply('What do you build?')).toContain(FAQS[0].a)
  })

  it('lists the stack with an about link', () => {
    const r = reply('What tech stack do you use?')
    for (const t of TOOLS) expect(r).toContain(t.name)
    expect(r).toContain('](/about)')
  })

  it('finds the stack from a punctuated or joined tool name', () => {
    const stack = reply('What tech stack do you use?')
    expect(reply('Do you use Next.js?')).toBe(stack)
    expect(reply('do you use nextjs')).toBe(stack)
  })

  it('lists the courses', () => {
    const r = reply('Any certifications?')
    for (const c of CERTS) expect(r).toContain(c.name)
  })

  it('says who Justine is and where he is based', () => {
    const r = reply('Who are you?')
    expect(r).toContain(about.description)
    expect(r).toContain(about.location.title)
  })

  it('answers a greeting with the fixed line', () => {
    expect(reply('hello')).toBe(chat.fallback.hello)
  })

  it("answers a barbershop owner with Ostler's case and its page", () => {
    const r = reply('I run a barbershop')
    expect(r).toContain(businessOf('ostler-barbers').name)
    for (const b of ostler) expect(r).toContain(b.name)
    expect(r).toContain(`](${casePath('ostler-barbers', 'ai-agents.html')})`)
  })

  it('lists every business for a general request for examples', () => {
    const r = reply('Show me some examples')
    for (const b of businesses) expect(r).toContain(b.name)
    expect(r).toContain('](/projects)')
  })

  it('lists both businesses when two cases tie', () => {
    const r = reply('I am a residential developer')
    expect(r).toContain(businessOf('oriel-portugal-residences').name)
    expect(r).toContain(businessOf('westmere-los-angeles').name)
    expect(r).toContain('](/projects)')
  })

  it("does not mistake everyday words in a case's name for that case", () => {
    expect(reply('What training have you had?')).toBe(reply('Any certifications?'))
    expect(reply('I need a personal website')).toBe(reply('Do you do SEO?'))
    expect(reply('What range of services do you have?')).toBe(reply('Do you do SEO?'))
  })

  it('matches whole words only', () => {
    expect(reply('I have a startup')).not.toContain(FAQS[1].a)
    expect(reply('accurate answers')).not.toContain(FAQS[2].a)
  })

  it('gives a tie to the earlier topic', () => {
    expect(reply('process and services')).toBe(reply('What is your process?'))
  })

  it('answers an unknown question honestly, with the hand-off', () => {
    const unknown = `${chat.fallback.unknown}\n[[contact]]`
    expect(reply('What is the weather in Paris?')).toBe(unknown)
    expect(reply('???')).toBe(unknown)
  })

  it('adds the hand-off to any topic when the visitor shows buying interest', () => {
    const r = reply('I have a project for you, what is your process?')
    expect(r).toContain(PROCESS[0].name)
    expect(r.endsWith('\n[[contact]]')).toBe(true)
  })

  it('only ever links to pages the site has', () => {
    for (const q of asked) {
      for (const [, path] of fallbackReply(q).matchAll(/\]\(([^)]+)\)/g)) expect(KNOWN_PATHS.has(path), `${q} → ${path}`).toBe(true)
    }
  })
})

describe('fallbackReply, as a prospect reads it', () => {
  const unknown = `${chat.fallback.unknown}\n[[contact]]`

  it('calls a single case a sample system, in a sentence that reads right', () => {
    const r = reply('I run a garage')
    expect(r).toContain('sample')
    expect(r).toContain(businessOf('meridian-werks').name)
    expect(r).not.toMatch(/, a automotive/)
    expect(reply('I run a barbershop')).not.toContain('built for')
  })

  it('answers the questions a prospect is most likely to ask', () => {
    expect(reply('I need my lead intake automated.')).toBe(reply('Do you do SEO?'))
    expect(reply('How long will it take?')).toContain(FAQS[1].a)
    expect(reply('What timezone are you in?')).toContain(FAQS[1].a)
    expect(reply('Where can I see your work?')).toContain('](/projects)')
    for (const q of ['I want to hire you', "Let's work together", 'Can we schedule a call?', 'How can I contact you?']) {
      const r = reply(q)
      expect(r, q).toContain(FAQS[3].a)
      expect(r.endsWith('\n[[contact]]'), q).toBe(true)
    }
  })

  it('says it cannot answer an unrelated question instead of answering a different one', () => {
    for (const q of ['Who won the election?', "What's the weather in Manila?", 'Do you offer refunds?', 'What languages do you speak?', 'Do you support Shopify?', 'Can it reply to emails?']) {
      expect(reply(q), q).toBe(unknown)
    }
  })

  it('speaks as the site assistant, not as Justine, when asked who it is', () => {
    const r = reply('Who are you?')
    expect(r.startsWith(chat.fallback.intro.about)).toBe(true)
    expect(r).toContain(about.description)
  })

  it('keeps every reply short enough to send back as history', () => {
    for (const key of Object.keys(CASES)) {
      const r = reply(`I run a ${chat.fallback.caseWords[key][0]}`)
      expect(r.length, key).toBeLessThanOrEqual(MAX_LENGTH.assistant)
    }
    for (const q of ['Show me some examples', 'What tech stack do you use?', 'Do you do SEO?', 'What is your process?', 'Who are you?']) {
      expect(reply(q).length, q).toBeLessThanOrEqual(MAX_LENGTH.assistant)
    }
  })
})

describe('normalise', () => {
  it('lowercases, drops punctuation and collapses spaces', () => {
    expect(normalise('Next.js — AI-Agents!')).toBe('next js ai agents')
  })
})
