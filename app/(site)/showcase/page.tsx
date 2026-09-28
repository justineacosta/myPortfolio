import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'Showcase' }

export default function Page() {
  return <PagePlaceholder href="/showcase" phase={4} />
}
