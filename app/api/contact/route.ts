import { contact } from '@/data/contact'
import { checkLead, FIELDS } from '@/lib/contact'
import { confirmEmail, notifyEmail } from '@/lib/emails'
import { clientIp, leadAllowed } from '@/lib/leadLimit'
import { sendEmail } from '@/lib/resend'
import { SITE_URL } from '@/lib/site'

/**
 * The contact form's backend: checks the message with the form's own rules,
 * then sends it through Resend. Two emails go out, designed in lib/emails.ts:
 * - To CONTACT_TO, with Reply-To the visitor, so a reply goes straight to them.
 * - To the visitor, a short confirmation. It never repeats what they typed,
 *   so the form cannot be used to mail someone else's words. If it fails
 *   (say, the sending domain is not verified yet) the message still counts
 *   as sent.
 * Every refusal is { error: sentence } for the form to show.
 */

const refuse = (error: string, status: number) => Response.json({ error }, { status })

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

export async function POST(req: Request) {
  if (!leadAllowed(clientIp(req))) return refuse(contact.errors.rate, 429)

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

  try {
    await sendEmail(key, { from, to, replyTo: lead.email, ...notifyEmail(lead, new Date()) })
  } catch (err) {
    console.error('Contact form: the message was not sent.', err)
    return refuse(contact.errors.failed, 502)
  }
  try {
    await sendEmail(key, { from, to: lead.email, replyTo: to, ...confirmEmail(lead, SITE_URL) })
  } catch (err) {
    console.error('Contact form: the confirmation was not sent.', err)
  }
  return Response.json({ ok: true })
}
