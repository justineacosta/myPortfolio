import type Anthropic from '@anthropic-ai/sdk'
import { checkLead, FIELDS } from '@/lib/contact'
import { commands } from '@/lib/commands'
import type { AssistantEvent } from '@/lib/assistant/events'
import type { LeadLedger, Mailer } from '@/lib/assistant/mail'

/** What a tool may use during one turn: the conversation, its transcript so far, how to send mail, and who has already sent a lead. */
export type TurnContext = { conversationId: string; transcript: string; mailer: Mailer; ledger: LeadLedger }

/** What a tool returns: a sentence for Claude to read, and what the visitor's panel should show. */
export type ToolOutcome = { result: string; isError: boolean; event?: AssistantEvent; lead?: boolean }

/** A tool's definition for Claude and the code that runs it. `run` never throws. */
export type ToolRunner = { def: Anthropic.Tool; run(input: unknown, ctx: TurnContext): Promise<ToolOutcome> }

const fail = (result: string, event?: AssistantEvent): ToolOutcome => ({ result, isError: true, event })

const asObject = (input: unknown): Record<string, unknown> | null =>
  input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : null

const BAD_INPUT = 'That input was not an object with the expected fields.'
const LEAD_OK = 'Sent. Justine will reply by email within one business day.'
const LEAD_FAILED = 'The message did not send. Tell the visitor it did not go through and to use the Contact page (/contact) instead.'
const LEAD_ALREADY = 'A message was already sent in this conversation, so nothing more was sent. Tell the visitor Justine has it.'

const navigate: ToolRunner = {
  get def(): Anthropic.Tool {
    return {
      name: 'navigate',
      description: 'Take the visitor to a page of this site. Call it only when the visitor asks to go somewhere or clearly agrees to be taken there. Use one of the listed hrefs.',
      input_schema: {
        type: 'object',
        properties: {
          href: { type: 'string', enum: commands().map((c) => c.href), description: 'The page, or the section of a page, to open.' },
          label: { type: 'string', description: 'The page’s name as the visitor knows it, for example "Projects".' },
        },
        required: ['href', 'label'],
      },
    }
  },
  async run(input) {
    const body = asObject(input)
    if (!body || typeof body.href !== 'string') return fail(BAD_INPUT)
    const list = commands()
    const page = list.find((c) => c.href === body.href)
    if (!page) return fail(`Unknown page. The valid hrefs are: ${list.map((c) => c.href).join(', ')}.`)
    const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 60) : page.label
    return { result: `Taking the visitor to ${label}.`, isError: false, event: { type: 'navigate', href: page.href, label } }
  },
}

const LEAD_SCHEMA = {
  type: 'object' as const,
  properties: {
    firstName: { type: 'string', description: 'The visitor’s first name, as they gave it.' },
    lastName: { type: 'string', description: 'The visitor’s last name, as they gave it.' },
    email: { type: 'string', description: 'The email address Justine should reply to, as the visitor gave it.' },
    message: { type: 'string', description: 'A short description of what the visitor needs, in their words.' },
  },
  required: ['firstName', 'lastName', 'email', 'message'],
}

/** The two lead tools differ only in the email's subject: a call request is tagged. */
function leadTool(name: string, call: boolean, description: string): ToolRunner {
  return {
    def: {
      name,
      description:
        `${description} Before calling it, collect the visitor’s first name, last name, email and what they need, and confirm them back to the visitor. ` +
        'Never invent or guess any of these. If a field is missing or rejected, ask the visitor for it. It works once per conversation.',
      input_schema: LEAD_SCHEMA,
    },
    async run(input, ctx) {
      const body = asObject(input)
      if (!body) return fail(BAD_INPUT)
      if (ctx.ledger.has(ctx.conversationId)) return fail(LEAD_ALREADY)
      const data = new FormData()
      for (const k of FIELDS) if (typeof body[k] === 'string') data.set(k, body[k])
      const checked = checkLead(data)
      if (!checked.lead) return fail(checked.errors[FIELDS.find((k) => checked.errors[k])!]!)
      try {
        await ctx.mailer(checked.lead, { call, transcript: ctx.transcript })
      } catch (err) {
        console.error('Assistant: the lead was not sent.', err)
        return fail(LEAD_FAILED, { type: 'lead', ok: false })
      }
      ctx.ledger.add(ctx.conversationId)
      return { result: LEAD_OK, isError: false, event: { type: 'lead', ok: true }, lead: true }
    },
  }
}

const submitLead = leadTool('submit_lead', false, 'Send Justine a message from the visitor, who wants to work together or get in touch.')
const requestCall = leadTool('request_call', true, 'Ask Justine to call or meet the visitor. It sends the same details as submit_lead, tagged as a call request.')

/** The tools Claude may call, in a fixed order (it sits in the prompt-cache prefix): navigate, submit_lead, request_call. */
export function siteTools(): ToolRunner[] {
  return [navigate, submitLead, requestCall]
}
