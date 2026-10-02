import Facts from '@/components/showcase/Facts'
import Flagship from '@/components/showcase/Flagship'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { showcase } from '@/data/showcase'
import { notFoundIfHidden } from '@/lib/hidden'
import { ledeOr, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/showcase', ledeOr(showcase.lede, showcase.title.join(' ')))

export default function Page() {
  notFoundIfHidden('/showcase')
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <div className="flex flex-col gap-3">
        <PageHeader href="/showcase" title={showcase.title} lede={showcase.lede} />
        <p className="max-w-[580px] font-mono text-[11px] tracking-[.06em] text-ink3">{showcase.sample}</p>
      </div>
      <div data-reveal>
        <Frame lit={{ x: '30%', alpha: 0.6, stop: '58%' }} className="flex flex-col gap-[clamp(28px,4cqw,56px)] p-[clamp(14px,2cqw,28px)]">
          <Flagship />
          <Facts />
        </Frame>
      </div>
    </section>
  )
}
