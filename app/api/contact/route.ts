import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import { checkLead, composeMessage, FIELDS, type Lead } from '@/lib/contact'
import { rateLimit } from '@/lib/rateLimit'

/**
 * The contact form's backend: checks the message with the form's own rules,
 * then sends it through Resend. Two emails go out:
 * - To CONTACT_TO, with Reply-To the visitor, so a reply goes straight to them.
 * - To the visitor, a short confirmation. It never repeats what they typed,
 *   so the form cannot be used to mail someone else's words. If it fails
 *   (say, the sending domain is not verified yet) the message still counts
 *   as sent.
 * Every refusal is { error: sentence } for the form to show.
 */

const allowed = rateLimit({ limit: 5, windowMs: 10 * 60 * 1000 })

const refuse = (error: string, status: number) => Response.json({ error }, { status })

type Mail = { from: string; to: string; replyTo: string; subject: string; text: string }

async function send(key: string, { from, to, replyTo, subject, text }: Mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text }),
  })
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${await res.text().catch(() => '')}`)
}

/** The same FormData the browser checks, built from the posted JSON. */
async function readForm(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const data = new FormData()
  for (const k of [...FIELDS, 'website']) {
    const v = body?.[k]
    if (typeof v === 'string') data.set(k, v)
  }
  return data
}

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

function confirmation(lead: Lead) {
  const r = contact.reply
  return { subject: r.subject, text: [`Hi ${lead.firstName},`, '', r.body, '', `— ${profile.name}`].join('\n') }
}

export async function POST(req: Request) {
  if (!allowed(clientIp(req))) return refuse(contact.errors.rate, 429)

  const result = checkLead(await readForm(req))
  if (!result.lead) return refuse(result.errors[FIELDS.find((k) => result.errors[k])!]!, 400)
  const lead = result.lead
  // A bot filled the hidden field: answer as if it worked, and send nothing.
  if (lead.website) return Response.json({ ok: true })

  const { RESEND_API_KEY: key, CONTACT_FROM: from, CONTACT_TO: to } = process.env
  if (!key || !from || !to) {
    console.error('Contact form: RESEND_API_KEY, CONTACT_FROM and CONTACT_TO must all be set.')
    return refuse(contact.errors.failed, 500)
  }

  const { subject, body } = composeMessage(lead)
  try {
    await send(key, { from, to, replyTo: lead.email, subject, text: body })
  } catch (err) {
    console.error('Contact form: the message was not sent.', err)
    return refuse(contact.errors.failed, 502)
  }
  try {
    await send(key, { from, to: lead.email, replyTo: to, ...confirmation(lead) })
  } catch (err) {
    console.error('Contact form: the confirmation was not sent.', err)
  }
  return Response.json({ ok: true })
}
