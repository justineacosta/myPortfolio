import Automation from '@/components/services/Automation'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import PageHeader from '@/components/ui/PageHeader'
import { servicesPage } from '@/data/services'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/services', servicesPage.lede)

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
