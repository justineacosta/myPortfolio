import { describe, expect, it } from 'vitest'
import { hasLeadForm, isSafeUrl, optionsOf, parseBlocks, parseInline, plainText, stripDirectives } from '@/lib/chat/rich'

describe('parseBlocks', () => {
  it('splits a reply into paragraphs, bullets and the directives alone on their line', () => {
    const reply = 'Ostler is a sample.\nIt books chairs.\n\n- One\n- Two\n\n[[project:ostler-barbers]]\nWant to talk?\n[[Lead-Form]]'
    expect(parseBlocks(reply)).toEqual([
      { kind: 'p', text: 'Ostler is a sample. It books chairs.' },
      { kind: 'ul', items: ['One', 'Two'] },
      { kind: 'project', slug: 'ostler-barbers' },
      { kind: 'p', text: 'Want to talk?' },
      { kind: 'lead-form' },
    ])
  })

  it('holds back a line that could still grow into a directive, so no partial marker shows mid-stream', () => {
    for (const partial of ['[', '[[', '[[proj', '[[project:os', '[[project:ostler]']) {
      expect(parseBlocks(`Here it is.\n${partial}`)).toEqual([{ kind: 'p', text: 'Here it is.' }])
    }
  })

  it('removes a directive inline with prose, and an unknown one, and never leaves an empty paragraph', () => {
    expect(parseBlocks('See this [[project:ostler-barbers]] here.')).toEqual([{ kind: 'p', text: 'See this here.' }])
    expect(parseBlocks('[[confetti]]\nHi')).toEqual([{ kind: 'p', text: 'Hi' }])
    expect(stripDirectives('a [[x]] b')).toBe('a b')
  })

  it('tells whether a reply asks for the form', () => {
    expect(hasLeadForm('Sure.\n[[lead-form]]')).toBe(true)
    expect(hasLeadForm('Sure.')).toBe(false)
  })
})

describe('optionsOf', () => {
  it('reads the answers to tap from an options line, plain, deduped, at most three', () => {
    expect(optionsOf('What did you have in mind?\n[[options:Build a **website**|Automate a workflow|Build a website|Add a bot|One more]]')).toEqual([
      'Build a website',
      'Automate a workflow',
      'Add a bot',
    ])
    expect(optionsOf('No question here.')).toEqual([])
  })

  it('never shows the options line in the bubble, finished or still streaming in', () => {
    expect(parseBlocks('What did you have in mind?\n\n[[options:A site|A bot]]')).toEqual([{ kind: 'p', text: 'What did you have in mind?' }])
    expect(parseBlocks('What did you have in mind?\n\n[[options:A si')).toEqual([{ kind: 'p', text: 'What did you have in mind?' }])
    expect(plainText('Which one?\n[[options:A|B]]')).toBe('Which one?')
  })
})

describe('parseInline', () => {
  it('reads bold, italic, code and links', () => {
    expect(parseInline('**Bold** and _it_ and `x` at [Services](/services).')).toEqual([
      { kind: 'bold', text: 'Bold' },
      { kind: 'text', text: ' and ' },
      { kind: 'italic', text: 'it' },
      { kind: 'text', text: ' and ' },
      { kind: 'code', text: 'x' },
      { kind: 'text', text: ' at ' },
      { kind: 'link', text: 'Services', href: '/services' },
      { kind: 'text', text: '.' },
    ])
  })

  it('shows only the label of a link that is not safe to follow', () => {
    for (const href of ['javascript:alert(1)', '//evil.example', 'data:text/html,hi', 'mailto:x@y.z']) {
      expect(parseInline(`[click](${href})`)).toEqual([{ kind: 'text', text: 'click' }])
    }
    expect(isSafeUrl('https://github.com/justineacosta')).toBe(true)
    expect(isSafeUrl('/contact')).toBe(true)
  })
})

describe('plainText', () => {
  it('is the words a screen reader announces: no markup, no directives', () => {
    expect(plainText('**Ostler** is a [sample](/projects).\n\n- One\n[[lead-form]]')).toBe('Ostler is a sample. One')
  })
})
