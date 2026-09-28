import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'Services' }

export default function Page() {
  return <PagePlaceholder href="/services" phase={3} />
}
