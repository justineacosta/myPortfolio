import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/privacy', legal.privacy.description, legal.privacy.title)

export default function Page() {
  return <LegalDoc doc={legal.privacy} />
}
