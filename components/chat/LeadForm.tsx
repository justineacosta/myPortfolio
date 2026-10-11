'use client'

import { useId, useState, type FormEvent } from 'react'
import { CheckCircleIcon, PaperPlaneRightIcon } from '@phosphor-icons/react/ssr'
import { chat } from '@/data/chat'
import { checkLead, MAX_EMAIL, MAX_MESSAGE, MAX_NAME, SubmitError, submitLead, type Errors } from '@/lib/contact'

const INPUT = 'h-9 w-full min-w-0 rounded-lg border border-b1 bg-s1 px-2.5 text-[13px] text-ink placeholder:text-ink3 aria-[invalid=true]:border-danger-b'
const LABEL = 'text-[11.5px] font-medium text-ink2'

/**
 * The contact form inside the chat, drawn from a `[[lead-form]]` line in a
 * reply (the old portfolio's lead-capture-card.tsx). It sends the same Lead
 * as the contact page, through lib/contact.ts and /api/contact, so the same
 * checks and the same limit apply. A refused send keeps what was typed and
 * shows the server's reason, since that limit is shared with the contact page.
 */
export default function LeadForm() {
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
      setErrors(result.errors)
      return
    }
    setErrors({})
    setStatus('sending')
    try {
      await submitLead(result.lead)
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setProblem(err instanceof SubmitError ? err.message : chat.replies.failed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))
    }
  }

  const field = (name: 'firstName' | 'lastName' | 'email', label: string, extra: object) => (
    <label className="flex min-w-0 flex-1 basis-[120px] flex-col gap-1">
      <span className={LABEL}>{label}</span>
      <input id={`${id}-${name}`} name={name} aria-invalid={Boolean(errors[name])} className={INPUT} {...extra} />
      {errors[name] && <span className="text-[11.5px] text-danger">{errors[name]}</span>}
    </label>
  )

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2.5 rounded-xl border border-b1 bg-s1 p-3">
      <p className="text-[12px] text-ink3">{t.intro}</p>
      <div className="flex flex-wrap gap-2">
        {field('firstName', t.firstName, { maxLength: MAX_NAME, autoComplete: 'given-name' })}
        {field('lastName', t.lastName, { maxLength: MAX_NAME, autoComplete: 'family-name' })}
      </div>
      {field('email', t.email, { type: 'email', maxLength: MAX_EMAIL, autoComplete: 'email' })}
      <label className="flex flex-col gap-1">
        <span className={LABEL}>{t.message}</span>
        <textarea name="message" rows={3} maxLength={MAX_MESSAGE} placeholder={t.messagePlaceholder} aria-invalid={Boolean(errors.message)} className={`${INPUT} h-auto resize-none py-2`} />
        {errors.message && <span className="text-[11.5px] text-danger">{errors.message}</span>}
      </label>
      {/* Honeypot: hidden from people, filled by bots, dropped by the route. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {problem && (
        <p role="alert" className="text-[12px] text-danger">
          {problem}
        </p>
      )}
      <button type="submit" disabled={status === 'sending'} className="inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-on-accent disabled:cursor-default disabled:opacity-60">
        <PaperPlaneRightIcon size={14} weight="fill" aria-hidden />
        {status === 'sending' ? t.sending : t.send}
      </button>
    </form>
  )
}
