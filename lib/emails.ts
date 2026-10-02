import { assistant } from '@/data/assistant'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import { composeMessage, type Lead } from '@/lib/contact'

/**
 * The contact form's two emails (app/api/contact/route.ts), each as HTML
 * with a plain-text copy. Email clients ignore stylesheets, so the layout
 * is tables with inline styles, in Kraft's light theme (it survives
 * dark-mode inversion best). Everything the visitor typed is escaped.
 */

/** Kraft's light tokens (app/globals.css), as hex: emails cannot read CSS variables. A test keeps them in step. */
export const EMAIL_PALETTE = {
  bg: '#F2F5F1',
  card: '#FFFFFF',
  panel: '#F7F9F5',
  line: '#EDF2EB',
  ink: '#0B1310',
  ink2: '#3B4742',
  ink3: '#69756F',
  accent: '#0E6B44',
  onAccent: '#F3FFF8',
}

export type Email = { subject: string; text: string; html: string }

const P = EMAIL_PALETTE
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace"

// Every attribute here is double-quoted, so a single quote needs no escaping.
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const kicker = (text: string) =>
  `<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:.14em;color:${P.accent}">${text}</p>`

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr><td style="border-radius:12px;background:${P.accent}">` +
  `<a href="${escape(href)}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:14px;font-weight:600;color:${P.onAccent};text-decoration:none;border-radius:12px">${label} &rarr;</a>` +
  `</td></tr></table>`

/** The page every email shares: the KRAFT wordmark, one white card, and a small footer. */
function page(preheader: string, body: string, footer: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${profile.studio}</title></head>
<body style="margin:0;padding:0;background:${P.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${P.bg}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px;font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:.2em;color:${P.ink}"><span style="display:inline-block;width:8px;height:8px;margin-right:10px;border-radius:2px;background:${P.accent}"></span>${profile.brand}</td></tr>
<tr><td style="padding:32px;background:${P.card};border:1px solid ${P.line};border-radius:16px;font-family:${SANS};color:${P.ink}">
${body}
</td></tr>
<tr><td style="padding:16px 4px 0;font-family:${MONO};font-size:11px;line-height:1.6;color:${P.ink3}">${footer}<br>${profile.studio.toUpperCase()} · ${profile.address.locality.toUpperCase()} · ${profile.tzLabel}</td></tr>
</table>
</td></tr></table>
</body></html>`
}

/** When a message came in, in my own time zone: "Sep 30, 2026, 10:05 AM GMT+8". */
function received(at: Date) {
  const when = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: profile.timezone }).format(at)
  return `${when.replace(/ /g, ' ')} ${profile.tzLabel}`
}

/** The email I get: who wrote, when, their message, and a button to reply. From the site assistant it can carry the chat transcript (labelled as what the visitor's browser sent, which the server never verified), be tagged as a call request and say where it came from in the footer. */
export function notifyEmail(lead: Lead, at: Date, extra: { transcript?: string; call?: boolean; footer?: string } = {}): Email {
  const n = contact.notify
  const composed = composeMessage(lead)
  const subject = extra.call ? `Call request from ${lead.firstName} ${lead.lastName}` : composed.subject
  const body = extra.transcript ? `${composed.body}\n\n${assistant.email.transcript}:\n${extra.transcript}` : composed.body
  const name = escape(`${lead.firstName} ${lead.lastName}`)
  const replyHref = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-top:1px solid ${P.line};width:96px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;color:${P.ink3};vertical-align:top">${label}</td>` +
    `<td style="padding:10px 0;border-top:1px solid ${P.line};font-size:14px;color:${P.ink}">${value}</td></tr>`
  const html = page(
    `${name}: ${escape(lead.message.slice(0, 90))}`,
    kicker(n.kicker) +
      `<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;letter-spacing:-.02em;color:${P.ink}">${name} ${n.wrote}</h1>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
      row(n.name, name) +
      row(n.email, `<a href="mailto:${escape(lead.email)}" style="color:${P.accent};text-decoration:none">${escape(lead.email)}</a>`) +
      row(n.received, received(at)) +
      `</table>` +
      `<p style="margin:24px 0 8px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;color:${P.ink3}">${n.message}</p>` +
      `<div style="padding:18px;background:${P.panel};border:1px solid ${P.line};border-radius:12px;font-size:14.5px;line-height:1.6;color:${P.ink2}">${escape(lead.message).replace(/\r?\n/g, '<br>')}</div>` +
      (extra.transcript
        ? `<p style="margin:24px 0 8px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;color:${P.ink3}">${escape(assistant.email.transcript)}</p>` +
          `<div style="padding:18px;background:${P.panel};border:1px solid ${P.line};border-radius:12px;font-size:13px;line-height:1.6;color:${P.ink2}">${escape(extra.transcript).replace(/\r?\n/g, '<br>')}</div>`
        : '') +
      button(replyHref, `${n.reply} ${escape(lead.firstName)}`),
    extra.footer ? escape(extra.footer) : n.footer,
  )
  return { subject, text: `${body}\n\nReceived: ${received(at)}`, html }
}

/** The visitor's confirmation. It never repeats their message, so the form cannot mail someone else's words. */
export function confirmEmail(lead: Lead, site: string): Email {
  const r = contact.reply
  const work = `${site}/projects`
  const steps = r.steps
    .map(
      (s, i) =>
        `<tr><td style="padding:8px 14px 8px 0;width:24px;font-family:${MONO};font-size:12px;color:${P.accent};vertical-align:top">${String(i + 1).padStart(2, '0')}</td>` +
        `<td style="padding:8px 0;font-size:14.5px;line-height:1.55;color:${P.ink2}">${escape(s)}</td></tr>`,
    )
    .join('')
  const html = page(
    escape(r.body),
    kicker(r.kicker) +
      `<h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;letter-spacing:-.02em;color:${P.ink}">${r.title}</h1>` +
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${P.ink}">Hi ${escape(lead.firstName)},</p>` +
      `<p style="margin:0;font-size:15px;line-height:1.6;color:${P.ink2}">${escape(r.body)}</p>` +
      `<p style="margin:28px 0 6px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;color:${P.ink3}">${r.next}</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>` +
      button(work, escape(r.cta)) +
      `<p style="margin:28px 0 0;font-size:15px;color:${P.ink}">— ${profile.name}</p>`,
    escape(r.footer),
  )
  const text = [
    `Hi ${lead.firstName},`,
    '',
    r.body,
    '',
    'What happens next:',
    ...r.steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `${r.cta}: ${work}`,
    '',
    `— ${profile.name}`,
  ].join('\n')
  return { subject: r.subject, text, html }
}
