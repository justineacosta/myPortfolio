import { legal, type LegalDocData } from '@/data/legal'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'

/** A legal page: kicker, title, date, the owner-review flag, then its sections and a contact line. */
export default function LegalDoc({ doc }: { doc: LegalDocData }) {
  const email = profile.email
  return (
    <article className="flex flex-col gap-7 pt-6">
      <header>
        <p className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">{doc.kicker}</p>
        <h1 className="text-[clamp(30px,6vw,48px)] leading-[1.05] font-bold tracking-[-.035em]">{doc.title}</h1>
        <p className="mt-3 font-mono text-[10.5px] tracking-[.08em] text-ink3">{doc.updated}</p>
      </header>
      <p role="note" className="rounded-[14px] border border-wash-b bg-wash px-4 py-3 text-[13px] leading-[1.55] text-ink2">
        {legal.review}
      </p>
      {doc.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-[-.02em]">{s.heading}</h2>
          <p className="max-w-[68ch] text-[14.5px] leading-[1.65] text-ink2">{s.body}</p>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-[-.02em]">{legal.contactHeading}</h2>
        <p className="text-[14.5px] leading-[1.65] text-ink2">
          {legal.contact}{' '}
          {isPlaceholder(email) ? <span className="font-mono text-[13px]">{email}</span> : <a href={`mailto:${email}`}>{email}</a>}
        </p>
      </section>
    </article>
  )
}
