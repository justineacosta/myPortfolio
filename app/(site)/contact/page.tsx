import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'FAQs / Contact' }

export default function Page() {
  return <PagePlaceholder href="/contact" phase={3} />
}
