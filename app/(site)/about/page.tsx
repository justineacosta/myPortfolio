import { Location } from '@/components/about/Aside'
import Workstation from '@/components/about/Workstation'
import Certified from '@/components/about/Certified'
import Intro from '@/components/about/Intro'
import Roles from '@/components/about/Roles'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { about } from '@/data/about'
import { notFoundIfHidden } from '@/lib/hidden'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/about', about.description)

const COLUMN = 'flex flex-col gap-[clamp(11px,1.3cqw,16px)]'

export default function Page() {
  notFoundIfHidden('/about')
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/about" title={about.title} lede={about.lede} ledeClassName="max-w-[560px]" />
      <Frame lit={{ x: '82%', alpha: 0.6, stop: '58%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${COLUMN} min-w-[min(260px,100%)] flex-[1_1_360px]`}>
          <Intro />
          <Roles />
        </div>
        <div className={`${COLUMN} min-w-[min(250px,100%)] flex-[1_1_300px]`}>
          <Workstation />
          <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,16px)]">
            <Certified />
            <Location />
          </div>
        </div>
      </Frame>
    </section>
  )
}
