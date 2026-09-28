import Feedback from '@/components/showcase/Feedback'
import Flagship from '@/components/showcase/Flagship'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { showcase } from '@/data/showcase'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/showcase', showcase.title.join(' '))

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/showcase" title={showcase.title} lede={showcase.lede} />
      <div data-reveal>
        <Frame lit={{ x: '30%', alpha: 0.6, stop: '58%' }} className="flex flex-col gap-[clamp(28px,4cqw,56px)] p-[clamp(14px,2cqw,28px)]">
          <Flagship />
          <Feedback />
        </Frame>
      </div>
    </section>
  )
}
