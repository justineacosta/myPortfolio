import { contact } from '@/data/contact'

/**
 * The contact form's rules, shared by the form and its route
 * (app/api/contact/route.ts, which sends through Resend). The form POSTs a
 * `Lead` as JSON to /api/contact. A non-2xx answer with { "error": "…" }
 * shows that sentence to the visitor.
 */
export const ENDPOINT = '/api/contact'

export const MAX_NAME = 80
export const MAX_EMAIL = 254
export const MAX_MESSAGE = 5000

// Built from \u escapes so the source stays pure ASCII. Control characters
// always go; the message keeps tab, LF and CR. Zero-width and bidi marks go too.
const CTRL_NO_NL = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')
const CTRL_KEEP_NL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g')
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]', 'g')

export function sanitize(input: string, allowNewlines = false): string {
  return input.replace(allowNewlines ? CTRL_KEEP_NL : CTRL_NO_NL, '').replace(ZERO_WIDTH, '')
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Lead = {
  firstName: string
  lastName: string
  email: string
  message: string
  /** Honeypot. Empty for a person; a backend should drop anything else. */
  website: string
}
export type Field = 'firstName' | 'lastName' | 'email' | 'message'
export const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'message']
export type Errors = Partial<Record<Field, string>>

/** Reads, trims, caps and sanitises the form, and names every field that needs fixing. */
export function checkLead(data: FormData): { lead: Lead; errors: null } | { lead: null; errors: Errors } {
  const read = (k: string) => String(data.get(k) ?? '').trim()
  const lead: Lead = {
    firstName: sanitize(read('firstName')).slice(0, MAX_NAME),
    lastName: sanitize(read('lastName')).slice(0, MAX_NAME),
    email: sanitize(read('email')).slice(0, MAX_EMAIL),
    message: sanitize(read('message'), true).slice(0, MAX_MESSAGE),
    website: String(data.get('website') ?? ''),
  }
  const e = contact.errors
  const errors: Errors = {}
  if (!lead.firstName) errors.firstName = e.firstName
  if (!lead.lastName) errors.lastName = e.lastName
  if (!lead.email) errors.email = e.email
  else if (!EMAIL_RE.test(lead.email)) errors.email = e.emailFormat
  if (!lead.message) errors.message = e.message
  return Object.keys(errors).length ? { lead: null, errors } : { lead, errors: null }
}

/** The subject and body of the email I get. */
export function composeMessage(lead: Lead): { subject: string; body: string } {
  return {
    subject: `Project inquiry from ${lead.firstName} ${lead.lastName}`,
    body: [`Name: ${lead.firstName} ${lead.lastName}`, `Email: ${lead.email}`, '', lead.message].join('\n'),
  }
}

export class SubmitError extends Error {}

export async function submitLead(lead: Lead): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: unknown } | null
    const said = typeof body?.error === 'string' && body.error ? body.error : ''
    throw new SubmitError(said || `The server answered ${res.status}.`)
  }
}
