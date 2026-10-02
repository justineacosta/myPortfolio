import { assistant } from '@/data/assistant'
import { confirmEmail, notifyEmail } from '@/lib/emails'
import type { Lead } from '@/lib/contact'
import { sendEmail } from '@/lib/resend'
import { SITE_URL } from '@/lib/site'

/** Sends a lead's emails. It throws when the message to Justine cannot go out. */
export type Mailer = (lead: Lead, opts: { call: boolean; transcript: string }) => Promise<void>

/** Remembers which conversations already sent a lead. */
export type LeadLedger = { has(id: string): boolean; add(id: string): void }

/** An in-memory set of conversation IDs that drops the oldest ones past `max`. */
export function leadLedger(max = 1000): LeadLedger {
  const ids = new Set<string>()
  return {
    has: (id) => ids.has(id),
    add(id) {
      ids.delete(id)
      ids.add(id)
      while (ids.size > max) ids.delete(ids.values().next().value!)
    },
  }
}

/** The real mailer: the contact route's two emails, plus the transcript. Reads RESEND_API_KEY, CONTACT_FROM and CONTACT_TO, and throws if any is missing. */
export function resendMailer(env: Record<string, string | undefined> = process.env): Mailer {
  return async (lead, opts) => {
    const { RESEND_API_KEY: key, CONTACT_FROM: from, CONTACT_TO: to } = env
    if (!key || !from || !to) throw new Error('Assistant: RESEND_API_KEY, CONTACT_FROM and CONTACT_TO must all be set.')
    await sendEmail(key, { from, to, replyTo: lead.email, ...notifyEmail(lead, new Date(), { ...opts, footer: assistant.email.footer }) })
    try {
      await sendEmail(key, { from, to: lead.email, replyTo: to, ...confirmEmail(lead, SITE_URL) })
    } catch (err) {
      console.error('Assistant: the confirmation was not sent.', err)
    }
  }
}

/** The mailer for ASSISTANT_FAKE=1: sends nothing, logs it. */
export const fakeMailer: Mailer = async (lead) => {
  console.info('Assistant (fake): lead not sent', lead.email)
}
