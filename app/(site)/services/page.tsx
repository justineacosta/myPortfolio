import type { Metadata } from 'next'
import Automation from '@/components/services/Automation'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import PageHeader from '@/components/ui/PageHeader'
import { servicesPage } from '@/data/services'

export const metadata: Metadata = { title: 'Services' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/services" title={servicesPage.title} lede={servicesPage.lede} />
      <Method />
      <Offers />
      <Automation />
    </section>
  )
}
