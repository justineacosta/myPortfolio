import Availability from '@/components/contact/Availability'
import ContactForm from '@/components/contact/ContactForm'
import Faqs from '@/components/contact/Faqs'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { CARD } from '@/components/ui/styles'
import { contact } from '@/data/contact'
import { notFoundIfHidden } from '@/lib/hidden'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/contact', contact.lede)

export default function Page() {
  notFoundIfHidden('/contact')
  const q = contact.faqs
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/contact" title={contact.title} lede={contact.lede} ledeClassName="max-w-[560px]" />
      <Frame lit={{ x: '72%', alpha: 0.6, stop: '56%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${CARD} min-w-[min(260px,100%)] flex-[2_1_380px] p-[clamp(16px,1.8cqw,24px)]`}>
          <ContactForm />
        </div>
        <section
          id={q.id}
          aria-labelledby="faqs-title"
          className={`${CARD} flex min-w-[min(250px,100%)] flex-[1_1_320px] scroll-mt-[88px] shell:scroll-mt-6 flex-col gap-1.5 p-[clamp(16px,1.8cqw,22px)]`}
        >
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{q.kicker}</span>
          <h2 id="faqs-title" className="text-[clamp(17px,2cqw,23px)] leading-[1.25] font-semibold tracking-[-.025em]">
            {q.title} <span className="block text-ink3">{q.aside}</span>
          </h2>
          <Faqs />
          <Availability />
        </section>
      </Frame>
    </section>
  )
}
