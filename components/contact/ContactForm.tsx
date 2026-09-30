'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { ArrowRightIcon, CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import {
  checkLead, FIELDS, MAX_EMAIL, MAX_MESSAGE, MAX_NAME, SubmitError, submitLead,
  type Errors, type Field,
} from '@/lib/contact'

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; note: string } | { kind: 'sent' }

const LABEL = 'font-mono text-[9.5px] tracking-[.14em] text-ink3'
const INPUT =
  'min-h-[46px] rounded-xl border border-b1 bg-field px-3.5 py-3 text-sm outline-none transition-[border-color,box-shadow] duration-250 focus:border-b2 focus:shadow-[0_0_0_3px_var(--wash)] aria-[invalid=true]:border-danger-b'

/**
 * Kraft's contact form (KraftScreens.dc.html:474-519) wired through
 * lib/contact.ts:
 * - Checked on submit. After that, re-checked as the visitor types, so
 *   each error clears the moment its field is fixed.
 * - The first bad field takes focus.
 * - A refused send keeps everything typed and shows the server's reason.
 */
export default function ContactForm() {
  const f = contact.fields
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [errors, setErrors] = useState<Errors>({})
  const form = useRef<HTMLFormElement>(null)
  const checked = useRef(false)
  const again = useRef(false)

  useEffect(() => {
    if (status.kind !== 'idle' || !again.current) return
    again.current = false
    form.current?.querySelector<HTMLInputElement>('input[name="firstName"]')?.focus()
  }, [status])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    checked.current = true
    const result = checkLead(new FormData(el))
    if (!result.lead) {
      // Render the errors before focus moves, so the field is announced with its reason.
      flushSync(() => setErrors(result.errors))
      const first = FIELDS.find((k) => result.errors[k])
      el.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setErrors({})
    setStatus({ kind: 'sending' })
    try {
      await submitLead(result.lead)
      setStatus({ kind: 'sent' })
    } catch (err) {
      setStatus({ kind: 'error', note: err instanceof SubmitError ? err.message : contact.errors.failed })
    }
  }

  const recheck = () => {
    if (!checked.current || !form.current) return
    setErrors(checkLead(new FormData(form.current)).errors ?? {})
  }

  if (status.kind === 'sent') {
    return (
      <Sent
        onAgain={() => {
          checked.current = false
          again.current = true
          setStatus({ kind: 'idle' })
        }}
      />
    )
  }

  const described = (k: Field) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `contact-${k}-error` } : {})
  const error = (k: Field) =>
    errors[k] && (
      <p id={`contact-${k}-error`} className="flex items-center gap-1.5 text-xs text-ink2">
        <WarningCircleIcon size={14} aria-hidden className="shrink-0 text-danger" />
        {errors[k]}
      </p>
    )

  return (
    <form ref={form} onSubmit={onSubmit} onChange={recheck} noValidate className="relative flex flex-col gap-3.5">
      {/* Honeypot: hidden from people and assistive tech; a bot that fills every field trips it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <div className="flex flex-wrap gap-3.5">
        <div className="flex min-w-[min(150px,100%)] flex-[1_1_180px] flex-col gap-[7px]">
          <label htmlFor="contact-firstName" className={LABEL}>{f.firstName.label}</label>
          <input id="contact-firstName" name="firstName" type="text" autoComplete="given-name" maxLength={MAX_NAME} placeholder={f.firstName.placeholder} className={INPUT} {...described('firstName')} />
          {error('firstName')}
        </div>
        <div className="flex min-w-[min(150px,100%)] flex-[1_1_180px] flex-col gap-[7px]">
          <label htmlFor="contact-lastName" className={LABEL}>{f.lastName.label}</label>
          <input id="contact-lastName" name="lastName" type="text" autoComplete="family-name" maxLength={MAX_NAME} placeholder={f.lastName.placeholder} className={INPUT} {...described('lastName')} />
          {error('lastName')}
        </div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="contact-email" className={LABEL}>{f.email.label}</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={MAX_EMAIL} placeholder={f.email.placeholder} className={INPUT} {...described('email')} />
        {error('email')}
      </div>
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="contact-message" className={LABEL}>{f.message.label}</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={MAX_MESSAGE}
          placeholder={f.message.placeholder}
          className={`${INPUT} min-h-[180px] resize-y leading-[1.55] shell:min-h-[337px]`}
          {...described('message')}
        />
        {error('message')}
      </div>
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        <button
          type="submit"
          disabled={status.kind === 'sending'}
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)] disabled:cursor-wait disabled:opacity-70"
        >
          {status.kind === 'sending' ? contact.sending : contact.submit} <ArrowRightIcon size={16} aria-hidden />
        </button>
        {status.kind === 'error' ? (
          <div className="flex flex-col gap-1">
            <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-ink2">
              <WarningCircleIcon size={16} aria-hidden className="shrink-0 text-danger" />
              {status.note}
            </p>
            <p className="text-[12.5px] text-ink3">
              {contact.errors.direct} <span className="font-mono break-all text-ink2 select-all">{profile.email}</span>
            </p>
          </div>
        ) : (
          <span className="text-[12.5px] text-ink3">{contact.note}</span>
        )}
      </div>
    </form>
  )
}

/** Kraft's "Message queued." card (KraftScreens.dc.html:475-482). */
function Sent({ onAgain }: { onAgain: () => void }) {
  const s = contact.sent
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <div role="status" className="flex min-h-80 animate-rise flex-col items-start justify-center gap-3.5">
      <span aria-hidden className="grid size-[54px] place-items-center rounded-full border border-wash-b bg-wash text-[26px] text-accent">
        <CheckCircleIcon />
      </span>
      <h2 ref={heading} tabIndex={-1} className="text-[22px] font-bold tracking-[-.03em] outline-none">
        {s.title}
      </h2>
      <p className="max-w-[340px] text-[13.5px] leading-[1.55] text-ink3">{s.body}</p>
      <button
        type="button"
        onClick={onAgain}
        className="min-h-11 cursor-pointer rounded-xl border border-b2 bg-transparent px-[18px] py-[11px] text-[13px] font-medium text-ink transition-colors duration-300 hover:bg-hover"
      >
        {s.again}
      </button>
    </div>
  )
}
