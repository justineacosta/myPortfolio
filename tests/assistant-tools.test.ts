import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { contact } from '@/data/contact'
import { NAV } from '@/data/nav'
import { leadLedger, type Mailer } from '@/lib/assistant/mail'
import { siteTools, type TurnContext } from '@/lib/assistant/tools'
import { commands } from '@/lib/commands'

const GOOD = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.' }
const tool = (name: string) => siteTools().find((t) => t.def.name === name)!

describe('siteTools', () => {
  let mailer: Mock<Mailer>
  let ctx: TurnContext
  beforeEach(() => {
    mailer = vi.fn<Mailer>().mockResolvedValue(undefined)
    ctx = { conversationId: 'c1', transcript: 'Visitor: hi\nAssistant: hello', mailer, ledger: leadLedger() }
  })

  it('lists navigate, submit_lead and request_call in a fixed order, the same JSON every time', () => {
    expect(siteTools().map((t) => t.def.name)).toEqual(['navigate', 'submit_lead', 'request_call'])
    expect(JSON.stringify(siteTools().map((t) => t.def))).toBe(JSON.stringify(siteTools().map((t) => t.def)))
  })

  describe('navigate', () => {
    it('sends the visitor to a known page', async () => {
      const out = await tool('navigate').run({ href: '/projects', label: 'Projects' }, ctx)
      expect(out.isError).toBe(false)
      expect(out.event).toEqual({ type: 'navigate', href: '/projects', label: 'Projects' })
    })

    it('refuses an unknown page and lists the valid ones', async () => {
      const out = await tool('navigate').run({ href: '/nope' }, ctx)
      expect(out.isError).toBe(true)
      expect(out.event).toBeUndefined()
      for (const c of commands()) expect(out.result).toContain(c.href)
    })

    it('refuses a hidden page, checked at call time', async () => {
      const showcase = NAV.find((n) => n.href === '/showcase')!
      showcase.hidden = true
      const out = await tool('navigate').run({ href: '/showcase', label: 'Showcase' }, ctx)
      expect(out.isError).toBe(true)
      expect(out.result).not.toContain('/showcase,')
    })

    it('enumerates the pages that are on', () => {
      const props = tool('navigate').def.input_schema.properties as { href: { enum: string[] } }
      expect(props.href.enum).toEqual(commands().map((c) => c.href))
    })
  })

  describe('submit_lead', () => {
    it('mails a good lead with the transcript and reports it', async () => {
      const out = await tool('submit_lead').run(GOOD, ctx)
      expect(out.isError).toBe(false)
      expect(out.lead).toBe(true)
      expect(out.event).toEqual({ type: 'lead', ok: true })
      expect(mailer).toHaveBeenCalledWith(expect.objectContaining(GOOD), { call: false, transcript: ctx.transcript })
    })

    it("returns the field's error and sends nothing when the lead is bad", async () => {
      const out = await tool('submit_lead').run({ ...GOOD, lastName: '' }, ctx)
      expect(out.isError).toBe(true)
      expect(out.result).toBe(contact.errors.lastName)
      expect(mailer).not.toHaveBeenCalled()
    })

    it('refuses a second lead in the same conversation', async () => {
      await tool('submit_lead').run(GOOD, ctx)
      const again = await tool('submit_lead').run(GOOD, ctx)
      expect(again.isError).toBe(true)
      expect(again.result).toContain('already sent')
      expect(mailer).toHaveBeenCalledTimes(1)
    })

    it('reports a mail failure, and lets the visitor retry', async () => {
      mailer.mockRejectedValueOnce(new Error('boom'))
      const out = await tool('submit_lead').run(GOOD, ctx)
      expect(out.isError).toBe(true)
      expect(out.event).toEqual({ type: 'lead', ok: false })
      expect(ctx.ledger.has('c1')).toBe(false)
      const retry = await tool('submit_lead').run(GOOD, ctx)
      expect(retry.isError).toBe(false)
      expect(ctx.ledger.has('c1')).toBe(true)
    })
  })

  describe('request_call', () => {
    it('mails the lead as a call request', async () => {
      const out = await tool('request_call').run(GOOD, ctx)
      expect(out.isError).toBe(false)
      expect(mailer).toHaveBeenCalledWith(expect.objectContaining(GOOD), { call: true, transcript: ctx.transcript })
    })
  })

  it('never throws on bad input', async () => {
    for (const t of siteTools()) {
      for (const bad of ['x', null, 7, [], { href: 5, firstName: 3 }]) {
        const out = await t.run(bad, ctx)
        expect(out.isError).toBe(true)
        expect(typeof out.result).toBe('string')
      }
    }
    expect(mailer).not.toHaveBeenCalled()
  })
})

describe('leadLedger', () => {
  it('remembers conversations and forgets the oldest past its limit', () => {
    const l = leadLedger(2)
    l.add('a')
    l.add('b')
    l.add('c')
    expect(l.has('a')).toBe(false)
    expect(l.has('b')).toBe(true)
    expect(l.has('c')).toBe(true)
  })
})
