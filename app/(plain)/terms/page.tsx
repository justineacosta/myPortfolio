import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/terms', legal.terms.description, legal.terms.title)

export default function Page() {
  return <LegalDoc doc={legal.terms} />
}
