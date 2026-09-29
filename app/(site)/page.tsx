import Bento from '@/components/home/Bento'
import Hero from '@/components/home/Hero'
import { home } from '@/data/home'
import { jsonLd, personJsonLd } from '@/lib/jsonld'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/', home.lede)

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd()) }} />
      <Hero />
      <Bento />
    </div>
  )
}
