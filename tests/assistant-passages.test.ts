import { describe, expect, it } from 'vitest'
import { FAQS } from '@/data/faqs'
import { NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { PROCESS, SERVICES } from '@/data/services'
import { commands } from '@/lib/commands'
import { buildPassages, sitePassages } from '@/lib/assistant/passages'

const hide = (href: string) => {
  NAV.find((n) => n.href === href)!.hidden = true
}

describe('buildPassages', () => {
  it('has a passage for every FAQ, service and Kraft Method step', () => {
    const titles = buildPassages().map((p) => p.title)
    for (const f of FAQS) expect(titles).toContain(f.q)
    for (const s of SERVICES) expect(titles).toContain(s.name)
    for (const step of PROCESS) expect(titles.some((t) => t.includes(step.name))).toBe(true)
  })

  it('leaves out placeholders and the contact email', () => {
    for (const p of buildPassages()) {
      for (const s of [p.title, p.text]) {
        expect(s).not.toContain('PLACEHOLDER')
        expect(s).not.toContain(profile.email)
      }
    }
  })

  it('links every passage to a page or section that commands() lists, under that entry’s label', () => {
    const cmds = commands()
    const passages = buildPassages()
    expect(passages.length).toBeGreaterThan(0)
    for (const p of passages) {
      const c = cmds.find((x) => x.href === p.href)
      expect(c, p.id).toBeDefined()
      expect(p.label).toBe(c!.label)
    }
  })

  it('leaves out the pages that are switched off', () => {
    hide('/showcase')
    hide('/testimonials')
    const passages = buildPassages()
    expect(passages.length).toBeGreaterThan(0)
    expect(passages.some((p) => p.href === '/showcase')).toBe(false)
    expect(passages.some((p) => p.href === '/testimonials')).toBe(false)
  })

  it('includes the showcase passages when that page is switched on', () => {
    expect(buildPassages().some((p) => p.href === '/showcase')).toBe(true)
  })

  it('gives every passage a unique id and some text', () => {
    const passages = buildPassages()
    const ids = passages.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of passages) {
      expect(p.title.trim(), p.id).not.toBe('')
      expect(p.text.trim(), p.id).not.toBe('')
    }
  })

  it('is built once for sitePassages', () => {
    expect(sitePassages()).toEqual(buildPassages())
    expect(sitePassages()).toBe(sitePassages())
  })
})
