// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { about } from '@/data/about'
import { assistant } from '@/data/assistant'
import { NAV } from '@/data/nav'
import type { AssistantEvent } from '@/lib/assistant/events'
import type { Passage } from '@/lib/assistant/passages'
import { quickTurn } from '@/lib/assistant/quick'

const q = assistant.quick
/** The About overview's title. */
const ABOUT = about.title[0]

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
    it.each(['hi', 'Hello', 'ok', 'Cool.', 'hi there', 'hey there', 'Hey there!', 'good morning', 'Good afternoon', 'good evening', 'hi justine', 'Hello, Kraft', 'hi justine, good morning'])('answers “%s” with the hello line', (msg) => {
      const r = run(msg)
      expect(r.events).toEqual([{ type: 'text', delta: q.hello }])
    })

    // The final review's ruling: a thanks gets its own line, not the greeting.
    it.each(['Thanks!', 'thank you', 'thanks, that helps', 'Thank you Justine', 'thanks, that’s very helpful'])('answers “%s” with the thanks line', (msg) => {
      const r = run(msg)
      expect(r.events).toEqual([{ type: 'text', delta: q.thanks }])
    })

    it('does not treat a greeting plus a question as a greeting', () => {
      expect(run('hi, what do you charge').text).not.toBe(q.hello)
      expect(run('thanks, what about your projects').text).not.toBe(q.thanks)
      expect(run('good morning, do you build websites').text).toMatch(/^\*\*/)
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

    it.each([
      ['Please take me to the build plan', '/projects#build-plan'],
      ['Can you show me your projects?', '/projects'],
      ['could you open the bio', '/about'],
      ['I want to go to the build plan', '/projects#build-plan'],
      ['I’d like to open the bio', '/about'],
      ['let me go to contact', '/contact'],
    ])('accepts a lead-in before the go-intent: “%s”', (msg, href) => {
      const nav = run(msg).events.find((e) => e.type === 'navigate')
      expect(nav).toMatchObject({ href })
    })

    it.each(['Are you open to new work?', 'Show me what you know about RAG', 'Are you open for hire?', 'Do you take me on for work?', 'show me how to hire you', 'what is the go to page for hire'])(
      'does not treat the question “%s” as a trip',
      (msg) => {
        expect(run(msg).types).not.toContain('navigate')
      },
    )

    it('still falls through to search and lead for such questions', () => {
      expect(run('Are you open for hire?').types).toEqual(['text', 'form'])
      expect(run('Show me what you know about RAG').text).toMatch(/^\*\*/)
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

    // The panel's own wording ("leave Justine a message") and the ways people ask to reach someone.
    it.each([
      'I want to leave a message',
      'leave Justine a message',
      'leave a message for Justine',
      'Can I message Justine?',
      'send a message',
      'I would like to talk to Justine',
      'can I speak to Justine',
      'how do I reach Justine',
      'contact',
      'How can I get in touch?',
      'I want to be in touch',
      'can we book a call',
      'call me',
      'can we schedule a call',
      'I’d like to meet with Justine',
      'can we set up a meeting',
    ])('asks for details and shows the form for “%s”', (msg) => {
      const r = run(msg)
      expect(r.text.endsWith(q.leadAsk)).toBe(true)
      expect(r.types).toEqual(['text', 'form'])
    })

    it('does not read “call” in “What do you call your process?” as a lead', () => {
      const r = run('What do you call your process?')
      expect(r.text.startsWith('**The Kraft Method**\n')).toBe(true)
      expect(r.text).not.toContain(q.leadAsk)
      expect(r.types).toEqual(['text'])
    })

    it('does not read “meet” in “Do you meet deadlines?” as a lead', () => {
      const r = run('Do you meet deadlines?')
      expect(r.text).not.toContain(q.leadAsk)
      expect(r.text === q.none || r.text.startsWith('**')).toBe(true)
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
        { id: 'b', title: 'Plans and pricing', text: 'Pricing plans start low.', href: '/contact#faqs', label: 'FAQs / Contact' },
        { id: 'c', title: 'Other', text: 'Unrelated words here.', href: '/about', label: 'About' },
      ]
      const r = run('pricing plans', { passages: among(...passages) })
      // The runner-up is named by its own title: its page's label ("FAQs / Contact", or "Quick answers" in the badge's words) says nothing to a visitor.
      expect(r.text).toBe('**Pricing plans**\nPricing plans start low.\nMore on [Services](/services)\nAlso: [Plans and pricing](/contact#faqs)')
    })

    // The final review's answer-quality list, as the visitor sees it: the passage's title leads the reply, and no form follows.
    it.each([
      ['What are your rates?', 'How much do you charge?'],
      ['what is your hourly rate', 'How much do you charge?'],
      ['How much does a website cost?', 'How much do you charge?'],
      ['Can you make me a chatbot for my website?', 'AI Agents & RAG'],
      ['Can you automate my invoices?', 'Automation & Workflows'],
      ['what is your process', 'The Kraft Method'],
      ['how do you work', 'The Kraft Method'],
      ['how does Justine work', 'The Kraft Method'],
      ['What services do you offer?', 'Services'],
      ['services', 'Services'],
      ['what projects have you done', 'Projects'],
      ['projects', 'Projects'],
      ['do you have a portfolio', 'Projects'],
      ['Who is Justine?', ABOUT],
      ['who are you', ABOUT],
      ['tell me about yourself', ABOUT],
      ['What do you do?', ABOUT],
      ['about', ABOUT],
      ['What is your tech stack?', 'Stack: Tools I work with'],
      ['what is the build plan', 'The build plan'],
      ['What do you build?', 'What do you actually build?'],
    ])('answers “%s” with “%s”', (msg, title) => {
      const r = run(msg)
      expect(r.text.startsWith(`**${title}**\n`)).toBe(true)
      expect(r.types).toEqual(['text'])
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
      // Six characters a word, so character 400 is the last letter of one: without the back-off the cut would end on a broken "word".
      const text = 'words '.repeat(200)
      expect(text[400]).not.toBe(' ')
      const body = run('words', { passages: among(passage(text)) }).text.split('\n')[1]
      expect(body.length).toBeLessThanOrEqual(401)
      expect(body.endsWith('…')).toBe(true)
      expect(body.slice(0, -1).endsWith('words')).toBe(true)
      expect(body.slice(0, -1).split(' ').every((w) => w === 'words')).toBe(true)
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
