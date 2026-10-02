'use client'

import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { assistant } from '@/data/assistant'
import { MAX_EMAIL, MAX_MESSAGE, MAX_NAME } from '@/lib/contact'
import { useAssistant, type Entry } from './AssistantProvider'

type Field = 'firstName' | 'lastName' | 'email' | 'message'
const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'message']

/** The look of an in-chat notice (a lead notice, an error, a navigation line). */
export const noteClass = 'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-b1 bg-chip px-3 py-2 text-[12.5px] text-ink2'

/** The link to the Contact page that ends a notice. */
export function ContactLink() {
  return (
    <ShellLink href={assistant.contact.href} className="font-medium text-accent underline underline-offset-2">
      {assistant.contact.label}
    </ShellLink>
  )
}

const LABEL = 'font-mono text-[10px] tracking-[.14em] text-ink3'
const INPUT = 'w-full min-w-0 rounded-xl border border-b1 bg-s1 px-3 py-2 text-[13.5px] text-ink placeholder:text-ink3 aria-[invalid=true]:border-danger-b'
const COLUMN = 'flex min-w-0 flex-col gap-1.5'

/**
 * The inline lead form the quick engine offers. Open, it is a form that posts through the chat (`submitForm`); sent, it reads as the lead confirmation; failed, as the failure
 * (the server's own line when it gave one) with the Contact link. `onSettled` hears the outcome's text once, for the panel's live region.
 */
export default function LeadFormCard({ entry, onSettled }: { entry: Extract<Entry, { kind: 'form' }>; onSettled?: (text: string) => void }) {
  const { streaming, submitForm } = useAssistant()
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [sending, setSending] = useState(false)
  const [reason, setReason] = useState<string>()
  const form = useRef<HTMLFormElement>(null)
  // Set in the same tick as the click, so a second submit can't start before `sending` has rendered.
  const busy = useRef(false)

  if (entry.state === 'sent') return <Notice text={assistant.leadOk} />
  if (entry.state === 'failed') return <Notice text={reason ?? assistant.leadFailed} />

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy.current || streaming) return
    busy.current = true
    setSending(true)
    const data = new FormData(e.currentTarget)
    const value = (k: Field) => String(data.get(k) ?? '')
    const res = await submitForm(entry.id, { firstName: value('firstName'), lastName: value('lastName'), email: value('email'), message: value('message'), call: data.get('call') !== null })
    busy.current = false
    setSending(false)
    if (res.ok) onSettled?.(assistant.leadOk)
    else if (res.errors) {
      // Render the errors before focus moves, so the field is announced with its reason.
      const found = res.errors
      flushSync(() => setErrors(found))
      const first = FIELDS.find((k) => found[k])
      if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    } else {
      const text = res.error ?? assistant.leadFailed
      setReason(text)
      onSettled?.(text)
    }
  }

  // An error goes as soon as its field is edited.
  const edited = (e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name as Field
    if (!errors[name]) return
    setErrors((cur) => {
      const next = { ...cur }
      delete next[name]
      return next
    })
  }

  const id = (k: Field) => `${entry.id}-${k}`
  const described = (k: Field) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${id(k)}-error` } : {})
  const error = (k: Field) =>
    errors[k] && (
      <p id={`${id(k)}-error`} className="flex items-start gap-1.5 text-[12px] text-ink2">
        <WarningCircleIcon size={14} aria-hidden className="mt-px shrink-0 text-danger" />
        {errors[k]}
      </p>
    )
  const f = assistant.quick.form

  return (
    <form ref={form} onSubmit={submit} onChange={edited} noValidate className="w-full">
      <fieldset className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-b1 bg-s2 p-3">
        <legend className="px-1 text-[13px] font-semibold text-ink">{f.title}</legend>
        <div className="flex flex-wrap gap-2.5">
          <div className={`${COLUMN} flex-[1_1_120px]`}>
            <label htmlFor={id('firstName')} className={LABEL}>{f.firstName}</label>
            <input id={id('firstName')} name="firstName" type="text" autoComplete="given-name" maxLength={MAX_NAME} className={INPUT} {...described('firstName')} />
            {error('firstName')}
          </div>
          <div className={`${COLUMN} flex-[1_1_120px]`}>
            <label htmlFor={id('lastName')} className={LABEL}>{f.lastName}</label>
            <input id={id('lastName')} name="lastName" type="text" autoComplete="family-name" maxLength={MAX_NAME} className={INPUT} {...described('lastName')} />
            {error('lastName')}
          </div>
        </div>
        <div className={COLUMN}>
          <label htmlFor={id('email')} className={LABEL}>{f.email}</label>
          <input id={id('email')} name="email" type="email" autoComplete="email" maxLength={MAX_EMAIL} className={INPUT} {...described('email')} />
          {error('email')}
        </div>
        <div className={COLUMN}>
          <label htmlFor={id('message')} className={LABEL}>{f.message}</label>
          <textarea id={id('message')} name="message" rows={3} maxLength={MAX_MESSAGE} className={`${INPUT} resize-y`} {...described('message')} />
          {error('message')}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink2">
          <input type="checkbox" name="call" className="size-4 shrink-0 cursor-pointer accent-accent" />
          {f.call}
        </label>
        <button type="submit" disabled={sending || streaming} className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-accent bg-accent px-3 text-[13px] font-semibold text-on-accent disabled:cursor-default disabled:opacity-60">
          {sending ? f.sending : f.send}
        </button>
      </fieldset>
    </form>
  )
}

function Notice({ text }: { text: string }) {
  return (
    <p className={noteClass}>
      <span>{text}</span>
      <ContactLink />
    </p>
  )
}
