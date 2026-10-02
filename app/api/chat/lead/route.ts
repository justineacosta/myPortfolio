import { after } from 'next/server'
import { assistant } from '@/data/assistant'
import { isFake } from '@/lib/assistant/config'
import { checkMessages, LIMITS, trimHistory, UUID } from '@/lib/assistant/limits'
import { conversationLeads, leadsSending } from '@/lib/assistant/ledger'
import { logTurn } from '@/lib/assistant/log'
import { fakeMailer, resendMailer } from '@/lib/assistant/mail'
import { checkLead, FIELDS } from '@/lib/contact'
import { clientIp, leadAllowed } from '@/lib/leadLimit'
import { rateLimit } from '@/lib/rateLimit'

/** The chat's form card backend: checks the card's fields with the contact form's own rules, sends the lead through the mailer and records the conversation in the shared ledger. Refusals are { error: sentence }, except a bad field, which is { errors: { field: sentence } }. */

const allowed = rateLimit(LIMITS.rate)

const refuse = (error: string, status: number) => Response.json({ error }, { status })

/** What the log shows for the form's send; the tool row's content cannot be empty. */
const SENT = 'Sent from the form card.'

/** Sends one lead from the chat's form card. 429 over the chat or lead limit, 400 for a bad request or field, 409 when the conversation already sent one, 502 when the mailer fails, else 200 { ok: true }. */
export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req)
  if (!allowed(ip)) return refuse(assistant.errors.rate, 429)

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (typeof body !== 'object' || body === null) return refuse(assistant.errors.bad, 400)
  const { conversationId, page, call, messages } = body
  if (typeof conversationId !== 'string' || !UUID.test(conversationId)) return refuse(assistant.errors.bad, 400)
  if (typeof page !== 'string' || !page.startsWith('/') || page.length > 200) return refuse(assistant.errors.bad, 400)
  if (typeof call !== 'boolean') return refuse(assistant.errors.bad, 400)
  const checked = checkMessages(messages, false)
  if (!checked.ok) return refuse(checked.error, 400)

  // The contact form's own check, over the same fields.
  const data = new FormData()
  for (const k of FIELDS) if (typeof body[k] === 'string') data.set(k, body[k])
  const result = checkLead(data)
  if (!result.lead) return Response.json({ errors: result.errors }, { status: 400 })

  // A send already in flight for this conversation counts as sent: two posts at once would otherwise both pass the ledger and email twice.
  // The check and the claim below run with no await between them, so no other request can slip in.
  if (conversationLeads.has(conversationId) || leadsSending.has(conversationId)) return refuse(assistant.quick.form.already, 409)
  if (!leadAllowed(ip)) return refuse(assistant.errors.rate, 429)
  leadsSending.add(conversationId)

  const transcript = trimHistory(checked.messages).map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n')
  try {
    await (isFake() ? fakeMailer : resendMailer())(result.lead, { call, transcript })
    conversationLeads.add(conversationId)
  } catch (err) {
    console.error('Assistant: the form card’s lead was not sent.', err)
    return refuse(assistant.leadFailed, 502)
  } finally {
    leadsSending.delete(conversationId)
  }

  after(() =>
    logTurn({
      conversationId,
      page,
      userText: '',
      record: { text: '', tools: [{ name: 'lead_form', input: { call }, result: SENT, isError: false }], usage: { input: 0, output: 0 }, leadSent: true, engine: 'site' },
    }).catch((err) => console.error('Assistant: logging the form card’s lead failed.', err)),
  )
  return Response.json({ ok: true })
}
