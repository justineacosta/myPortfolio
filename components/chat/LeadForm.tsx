'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircleIcon, EnvelopeSimpleIcon, PaperPlaneRightIcon } from '@phosphor-icons/react/ssr'
import { chat } from '@/data/chat'
import { contact } from '@/data/contact'
import { track } from '@/lib/analytics'
import { checkLead, MAX_EMAIL, MAX_MESSAGE, MAX_NAME, SubmitError, submitLead, type Errors, type Field } from '@/lib/contact'

const INPUT =
  'w-full min-w-0 rounded-lg border border-b1 bg-s0 px-2.5 text-[13px] text-ink outline-none placeholder:text-ink3 transition-[border-color,box-shadow] duration-250 focus:border-b2 focus:shadow-[0_0_0_3px_var(--wash)] aria-[invalid=true]:border-danger-b'

/**
 * The contact form inside the chat, drawn from a `[[lead-form]]` line in a
 * reply (the old portfolio's lead-capture-card.tsx), as a compact card: a
 * header line, the field names inside the fields (each still labelled for
 * screen readers, with its error tied to it), and a full-width send button.
 * It sends the same Lead as the contact page, through lib/contact.ts and
 * /api/contact, so the same checks and the same limit apply. A refused send
 * keeps what was typed and shows the server's reason. `draft` starts the
 * message with what the visitor asked Lumen, for them to edit.
 */
export default function LeadForm({ draft = '' }: { draft?: string }) {
  const id = useId()
  const t = chat.lead
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [problem, setProblem] = useState<string | null>(null)

  if (status === 'sent') {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl border border-b1 bg-s1 px-3 py-2.5 text-[13px] text-ink">
        <CheckCircleIcon size={18} weight="fill" className="shrink-0 text-accent" aria-hidden />
        {t.sent}
      </p>
    )
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const result = checkLead(new FormData(e.currentTarget))
    setProblem(null)
    if (!result.lead) {
      // The checks are the contact page's; the words are Lumen's.
      const ours: Errors = {}
      for (const [name, said] of Object.entries(result.errors) as [Field, string][]) {
        ours[name] = name === 'email' && said === contact.errors.emailFormat ? t.errors.emailFormat : t.errors[name]
      }
      setErrors(ours)
      return
    }
    setErrors({})
    setStatus('sending')
    try {
      await submitLead(result.lead)
      track('Contact sent')
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setProblem(err instanceof SubmitError ? err.message : chat.replies.failed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))
    }
  }

  /** A field named inside itself: the label is for screen readers, the placeholder for the eye. */
  const field = (name: Field, label: string, control: (props: object) => ReactNode) => {
    const fieldId = `${id}-${name}`
    const errorId = `${fieldId}-error`
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={fieldId} className="sr-only">
          {label}
        </label>
        {control({ id: fieldId, name, placeholder: label, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? errorId : undefined })}
        {errors[name] && (
          <span id={errorId} className="text-[11.5px] text-danger">
            {errors[name]}
          </span>
        )}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className="flex flex-col gap-2 rounded-xl border border-b1 bg-s1 p-3">
      <div className="mb-0.5 flex items-start gap-2">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg border border-wash-b bg-wash text-accent">
          <EnvelopeSimpleIcon size={14} weight="fill" />
        </span>
        <span className="flex flex-col leading-tight">
          <span id={`${id}-title`} className="text-[13px] font-semibold text-ink">
            {t.title}
          </span>
          <span className="text-[11.5px] text-ink3">{draft ? t.noteDraft : t.note}</span>
        </span>
      </div>
      <div className="flex gap-2">
        {field('firstName', t.firstName, (p) => <input {...p} maxLength={MAX_NAME} autoComplete="given-name" className={`${INPUT} h-9`} />)}
        {field('lastName', t.lastName, (p) => <input {...p} maxLength={MAX_NAME} autoComplete="family-name" className={`${INPUT} h-9`} />)}
      </div>
      {field('email', t.email, (p) => <input {...p} type="email" maxLength={MAX_EMAIL} autoComplete="email" className={`${INPUT} h-9`} />)}
      {field('message', t.message, (p) => <textarea {...p} rows={draft ? 4 : 2} defaultValue={draft} maxLength={MAX_MESSAGE} className={`${INPUT} resize-none py-2 leading-snug`} />)}
      {/* Honeypot: hidden from people, filled by bots, dropped by the route. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {problem && (
        <p role="alert" className="text-[12px] text-danger">
          {problem}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-0.5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
      >
        {status === 'sending' ? t.sending : t.send}
        <PaperPlaneRightIcon size={14} weight="fill" aria-hidden />
      </button>
    </form>
  )
}
