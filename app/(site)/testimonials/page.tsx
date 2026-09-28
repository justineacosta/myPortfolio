import type { Metadata } from 'next'
import Testimonials from '@/components/testimonials/Testimonials'
import PageHeader from '@/components/ui/PageHeader'
import { testimonialsPage } from '@/data/testimonials'

export const metadata: Metadata = { title: 'Testimonials' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/testimonials" title={testimonialsPage.title} lede={testimonialsPage.lede} ledeClassName="max-w-[820px]" />
      <Testimonials />
    </section>
  )
}
