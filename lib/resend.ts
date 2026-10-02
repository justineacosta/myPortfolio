import type { Email } from '@/lib/emails'

/** Sends one email through Resend's HTTP API. Throws when Resend does not answer 2xx. */
export async function sendEmail(key: string, { from, to, replyTo, subject, text, html }: Email & { from: string; to: string; replyTo: string }): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text, html }),
  })
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${await res.text().catch(() => '')}`)
}
