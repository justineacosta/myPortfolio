import Testimonials from '@/components/testimonials/Testimonials'
import PageHeader from '@/components/ui/PageHeader'
import { testimonialsPage } from '@/data/testimonials'
import { notFoundIfHidden } from '@/lib/hidden'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/testimonials', testimonialsPage.lede)

export default function Page() {
  notFoundIfHidden('/testimonials')
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/testimonials" title={testimonialsPage.title} lede={testimonialsPage.lede} ledeClassName="max-w-[820px]" />
      <Testimonials />
    </section>
  )
}
