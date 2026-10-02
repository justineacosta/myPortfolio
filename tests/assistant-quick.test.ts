// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { assistant } from '@/data/assistant'
import { NAV } from '@/data/nav'
import type { AssistantEvent } from '@/lib/assistant/events'
import type { Passage } from '@/lib/assistant/passages'
import { quickTurn } from '@/lib/assistant/quick'

const q = assistant.quick

/** Runs the quick engine on one visitor message and gathers what it emitted. */
function run(text: string, opts: { formShown?: boolean; leadSent?: boolean; passages?: Passage[] } = {}) {
  const events: AssistantEvent[] = []
  const record = quickTurn({ history: [{ role: 'user', content: text }], formShown: false, leadSent: false, emit: (e) => void events.push(e), ...opts })
  const textOf = (events.find((e) => e.type === 'text') as { delta: string } | undefined)?.delta ?? ''
  return { events, record, text: textOf, types: events.map((e) => e.type) }
}

/** Passages for a test, among enough unrelated ones that a word only they use clears MIN_SCORE (BM25 scores nothing in a corpus of two or three). */
const among = (...own: Passage[]): Passage[] => [...own, ...Array.from({ length: 40 }, (_, i): Passage => ({ id: `filler-${i}`, title: `Filler ${i}`, text: `Unrelated filler number ${i}.`, href: '/about', label: 'About' }))]
const passage = (text: string): Passage => ({ id: 'x', title: 'Long', text, href: '/', label: 'Home' })

describe('quickTurn', () => {
  describe('greeting or thanks', () => {
    it.each(['hi', 'Thanks!', 'Hello', 'thank you', 'ok', 'Cool.'])('answers “%s” with the hello line', (msg) => {
      const r = run(msg)
      expect(r.events).toEqual([{ type: 'text', delta: q.hello }])
    })

    it('does not treat a greeting plus a question as a greeting', () => {
      expect(run('hi, what do you charge').text).not.toBe(q.hello)
    })
  })

  describe('navigate', () => {
    it('takes the visitor to a page by its label', () => {
      const r = run('Show me your projects')
      expect(r.events).toEqual([
        { type: 'text', delta: `${q.going} Projects.` },
        { type: 'navigate', href: '/projects', label: 'Projects' },
      ])
      expect(r.record.tools).toEqual([{ name: 'navigate', input: { href: '/projects' }, result: 'Projects', isError: false }])
    })

    it('lets the longest label win', () => {
      const r = run('take me to the build plan')
      expect(r.events).toContainEqual({ type: 'navigate', href: '/projects#build-plan', label: 'The build plan' })
      expect(r.types).not.toContain('form')
    })

    it.each([
      ['show me your work', '/projects'],
      ['open your portfolio', '/projects'],
      ['take me to hire', '/contact'],
      ['go to contact', '/contact'],
      ['show me your prices', '/services'],
      ['bring me to the offers', '/services'],
      ['open the bio', '/about'],
      ['go to home', '/'],
    ])('treats “%s” as a trip to %s', (msg, href) => {
      expect(run(msg).events).toContainEqual(expect.objectContaining({ type: 'navigate', href }))
    })

    it('ignores punctuation and letter case', () => {
      expect(run('SHOW ME, your Projects!!').events).toContainEqual(expect.objectContaining({ type: 'navigate', href: '/projects' }))
    })

    it('emits the text before the navigate event', () => {
      expect(run('show me your projects').types).toEqual(['text', 'navigate'])
    })

    it('does not navigate to a page that is switched off', () => {
      const projects = NAV.find((n) => n.href === '/projects')!
      projects.hidden = true
      try {
        expect(run('show me your work').types).not.toContain('navigate')
      } finally {
        projects.hidden = false
      }
    })

    it('does not navigate without a go-intent', () => {
      expect(run('tell me about your projects').types).not.toContain('navigate')
    })
  })

  describe('lead', () => {
    it('asks for details and shows the form', () => {
      const r = run('I have a project in mind')
      expect(r.text.endsWith(q.leadAsk)).toBe(true)
      expect(r.types[r.types.length - 1]).toBe('form')
      expect(r.types.filter((t) => t === 'text')).toHaveLength(1)
    })

    it('answers a strong passage first, then asks', () => {
      const r = run('how much would it cost to hire you')
      expect(r.text.startsWith('**How much do you charge?**')).toBe(true)
      expect(r.text).toContain(q.leadAsk)
      expect(r.text.indexOf(q.leadAsk)).toBeGreaterThan(r.text.indexOf('More on'))
      expect(r.types).toEqual(['text', 'form'])
    })

    it('asks and shows the form when there is no passage to answer with', () => {
      const r = run('I want to hire you', { passages: [] })
      expect(r.text).toBe(q.leadAsk)
      expect(r.types).toEqual(['text', 'form'])
    })
  })

  describe('search', () => {
    it('answers with the best passage and a link to its page', () => {
      const r = run('do you use n8n')
      expect(r.text.startsWith('**Automation & Workflows**\n')).toBe(true)
      expect(r.text).toContain('More on [Services](/services)')
      expect(r.types).toEqual(['text'])
    })

    it('adds the runner-up when it scores 60% of the best and sits on another page', () => {
      const passages: Passage[] = [
        { id: 'a', title: 'Pricing plans', text: 'Pricing plans start low.', href: '/services', label: 'Services' },
        { id: 'b', title: 'Pricing plans', text: 'Pricing plans start low.', href: '/contact#faqs', label: 'FAQs / Contact' },
        { id: 'c', title: 'Other', text: 'Unrelated words here.', href: '/about', label: 'About' },
      ]
      const r = run('pricing plans', { passages: among(...passages) })
      expect(r.text).toBe('**Pricing plans**\nPricing plans start low.\nMore on [Services](/services)\nAlso: [FAQs / Contact](/contact#faqs)')
    })

    it('leaves out a runner-up on the same page, even when a section link differs', () => {
      const passages: Passage[] = [
        { id: 'a', title: 'Pricing plans', text: 'Pricing plans start low.', href: '/projects', label: 'Projects' },
        { id: 'b', title: 'Pricing plans', text: 'Pricing plans start low.', href: '/projects#build-plan', label: 'The build plan' },
        { id: 'c', title: 'Other', text: 'Unrelated words here.', href: '/about', label: 'About' },
      ]
      expect(run('pricing plans', { passages: among(...passages) }).text).not.toContain('Also:')
    })
  })

  describe('no match', () => {
    it('says so and shows the form', () => {
      const r = run('tell me a joke')
      expect(r.events).toEqual([{ type: 'text', delta: q.none }, { type: 'form' }])
    })
  })

  describe('the form card', () => {
    it('is not shown twice in a row', () => {
      expect(run('tell me a joke', { formShown: true }).types).toEqual(['text'])
      expect(run('I have a project in mind', { formShown: true }).types).not.toContain('form')
    })

    it('is not shown after a lead was sent', () => {
      const r = run('I have a project in mind', { leadSent: true })
      expect(r.types).toEqual(['text'])
      expect(r.text).toBe(q.form.already)
      expect(run('tell me a joke', { leadSent: true }).types).toEqual(['text'])
    })
  })

  describe('the answer’s length', () => {
    it('cuts a passage with no sentence end at a word, with an ellipsis', () => {
      const body = run('word', { passages: among(passage('word '.repeat(200))) }).text.split('\n')[1]
      expect(body.length).toBeLessThanOrEqual(401)
      expect(body.endsWith('…')).toBe(true)
      expect(body.slice(0, -1).endsWith('word')).toBe(true)
      expect(body.slice(0, -1).split(' ').every((w) => w === 'word')).toBe(true)
    })

    it('cuts a long passage after the last sentence end before character 400', () => {
      const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(' ')
      expect(text.length).toBeGreaterThan(600 - 100)
      const body = run('sentence', { passages: among(passage(text)) }).text.split('\n')[1]
      const end = text.lastIndexOf('.', 399) + 1
      expect(body).toBe(text.slice(0, end))
      expect(body.length).toBeLessThanOrEqual(400)
      expect(body.endsWith('.')).toBe(true)
    })

    it('keeps a short passage whole', () => {
      expect(run('word', { passages: among(passage('Word one. Word two.')) }).text.split('\n')[1]).toBe('Word one. Word two.')
    })
  })

  describe('the record', () => {
    it('is the site engine’s, with the emitted text', () => {
      const r = run('do you use n8n')
      expect(r.record).toEqual({ text: r.text, tools: [], usage: { input: 0, output: 0 }, leadSent: false, engine: 'site' })
    })

    it('never emits done', () => {
      for (const msg of ['hi', 'show me your projects', 'hire you', 'do you use n8n', 'tell me a joke']) expect(run(msg).types).not.toContain('done')
    })

    it('reads only the last message of the visitor', () => {
      const events: AssistantEvent[] = []
      const record = quickTurn({
        history: [
          { role: 'user', content: 'tell me a joke' },
          { role: 'assistant', content: q.none },
          { role: 'user', content: 'hi' },
        ],
        formShown: true,
        leadSent: false,
        emit: (e) => void events.push(e),
      })
      expect(record.text).toBe(q.hello)
    })
  })
})
