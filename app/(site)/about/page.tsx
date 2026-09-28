import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'About' }

export default function Page() {
  return <PagePlaceholder href="/about" phase={3} />
}
