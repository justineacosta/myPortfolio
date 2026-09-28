import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'Testimonials' }

export default function Page() {
  return <PagePlaceholder href="/testimonials" phase={3} />
}
