import Automation from '@/components/services/Automation'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { CTA } from '@/components/projects/styles'
import { ShellLink } from '@/components/shell/NavigationProvider'
import PageHeader from '@/components/ui/PageHeader'
import { isHidden } from '@/data/nav'
import { servicesPage } from '@/data/services'
import { notFoundIfHidden } from '@/lib/hidden'
import { jsonLd, servicesJsonLd } from '@/lib/jsonld'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/services', servicesPage.description)

export default function Page() {
  notFoundIfHidden('/services')
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(servicesJsonLd()) }} />
      <PageHeader href="/services" title={servicesPage.title} lede={servicesPage.lede} />
      <Method />
      <Offers />
      <Automation />
      {!isHidden(servicesPage.guides.href) && (
        <ShellLink href={servicesPage.guides.href} className={`${CTA} self-start text-[11px]`}>
          {servicesPage.guides.label} <ArrowRightIcon size={13} aria-hidden />
        </ShellLink>
      )}
    </section>
  )
}
