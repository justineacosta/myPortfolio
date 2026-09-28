import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'Projects' }

export default function Page() {
  return <PagePlaceholder href="/projects" phase={3} />
}
